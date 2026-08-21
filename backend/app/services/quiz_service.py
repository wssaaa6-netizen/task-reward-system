import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.database.mongodb import get_database
from app.schemas.quiz import (
    QuizListItem,
    QuizPlayResponse,
    QuizQuestionSafe,
    QuizSubmitRequest,
    QuizResultResponse,
    QuestionResultReview,
)
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.services.referral_service import ReferralService
from app.services.achievement_service import AchievementService
from app.services.fraud_service import FraudService

logger = logging.getLogger("task2cash.services.quiz")

class QuizService:
    @staticmethod
    async def list_quizzes(
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[QuizListItem]:
        db = get_database()
        query: Dict[str, Any] = {"status": "ACTIVE"}
        if category and category != "ALL":
            query["category"] = category
        if difficulty and difficulty != "ALL":
            query["difficulty"] = difficulty
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]

        cursor = db.quizzes.find(query).sort("created_at", -1)
        items: List[QuizListItem] = []

        # Find user completed attempts
        user_attempts_map = {}
        if user_id:
            user_atts = await db.quiz_attempts.find({"user_id": user_id}).to_list(500)
            for att in user_atts:
                q_id = att["quiz_id"]
                if q_id not in user_attempts_map or att.get("points_earned", 0) > user_attempts_map[q_id].get("points_earned", 0):
                    user_attempts_map[q_id] = att

        async for doc in cursor:
            quiz_id = str(doc["_id"])
            questions = doc.get("questions", [])
            total_points = sum(q.get("points", 10) for q in questions)
            user_attempt = user_attempts_map.get(quiz_id)

            items.append(QuizListItem(
                id=quiz_id,
                title=doc["title"],
                description=doc["description"],
                category=doc.get("category", "General Knowledge"),
                difficulty=doc.get("difficulty", "Medium"),
                duration_seconds=doc.get("duration_seconds", 180),
                total_questions=len(questions),
                total_points=total_points,
                passing_score_percentage=doc.get("passing_score_percentage", 60),
                status=doc.get("status", "ACTIVE"),
                cover_image=doc.get("cover_image"),
                attempts_count=doc.get("attempts_count", 0),
                is_completed_by_user=user_attempt is not None and user_attempt.get("passed", False),
                user_best_score=user_attempt.get("score") if user_attempt else None,
                user_points_earned=user_attempt.get("points_earned") if user_attempt else None,
                created_at=doc.get("created_at", datetime.now(timezone.utc))
            ))

        return items

    @staticmethod
    async def get_quiz_for_play(quiz_id: str) -> QuizPlayResponse:
        """
        Fetch quiz questions in SAFE mode without revealing correct answers or explanations!
        """
        db = get_database()
        doc = await db.quizzes.find_one({"_id": quiz_id, "status": "ACTIVE"})
        if not doc:
            raise HTTPException(status_code=404, detail="Quiz not found or not active")

        safe_questions = []
        total_points = 0
        for idx, q in enumerate(doc.get("questions", [])):
            q_id = q.get("id") or f"q_{idx}"
            pts = q.get("points", 10)
            total_points += pts
            safe_questions.append(QuizQuestionSafe(
                id=q_id,
                question=q["question"],
                question_type=q.get("question_type", "MULTIPLE_CHOICE"),
                options=q["options"],
                points=pts
            ))

        return QuizPlayResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            category=doc.get("category", "General Knowledge"),
            difficulty=doc.get("difficulty", "Medium"),
            duration_seconds=doc.get("duration_seconds", 180),
            total_questions=len(safe_questions),
            total_points=total_points,
            passing_score_percentage=doc.get("passing_score_percentage", 60),
            questions=safe_questions
        )

    @staticmethod
    async def submit_quiz_attempt(user_id: str, submission: QuizSubmitRequest) -> QuizResultResponse:
        """
        Calculates score strictly on backend, verifies timer, prevents duplicate exploitation,
        awards points, checks fraud anomalies, and returns full question breakdown.
        """
        db = get_database()
        quiz = await db.quizzes.find_one({"_id": submission.quiz_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        questions = quiz.get("questions", [])
        if not questions:
            raise HTTPException(status_code=400, detail="Quiz has no questions configured.")

        # Build mapping of questions by ID or index
        questions_map = {}
        for idx, q in enumerate(questions):
            q_id = q.get("id") or f"q_{idx}"
            questions_map[q_id] = q

        user_answers_map = {a.question_id: a.selected_option_index for a in submission.answers}

        correct_count = 0
        wrong_count = 0
        unanswered_count = 0
        score_earned = 0
        total_possible_score = 0
        reviews: List[QuestionResultReview] = []

        for idx, q in enumerate(questions):
            q_id = q.get("id") or f"q_{idx}"
            correct_idx = q.get("correct_option_index", 0)
            q_pts = q.get("points", 10)
            total_possible_score += q_pts

            selected_idx = user_answers_map.get(q_id)
            if selected_idx is None:
                unanswered_count += 1
                is_correct = False
                pts_awarded = 0
            elif selected_idx == correct_idx:
                correct_count += 1
                is_correct = True
                pts_awarded = q_pts
                score_earned += q_pts
            else:
                wrong_count += 1
                is_correct = False
                pts_awarded = 0

            reviews.append(QuestionResultReview(
                question_id=q_id,
                question=q["question"],
                options=q["options"],
                selected_option_index=selected_idx,
                correct_option_index=correct_idx,
                is_correct=is_correct,
                explanation=q.get("explanation", ""),
                points_awarded=pts_awarded
            ))

        accuracy = round((correct_count / len(questions)) * 100, 1) if questions else 0.0
        passing_pct = quiz.get("passing_score_percentage", 60)
        passed = accuracy >= passing_pct

        # Check if user previously passed this quiz to avoid duplicate point awards
        prior_passed_attempt = await db.quiz_attempts.find_one({
            "user_id": user_id,
            "quiz_id": submission.quiz_id,
            "passed": True
        })
        is_duplicate = prior_passed_attempt is not None

        points_awarded = score_earned if (passed and not is_duplicate) else 0

        now = datetime.now(timezone.utc)
        attempt_id = str(uuid.uuid4())

        # Save attempt record
        attempt_doc = {
            "_id": attempt_id,
            "user_id": user_id,
            "quiz_id": submission.quiz_id,
            "quiz_title": quiz["title"],
            "score": score_earned,
            "total_score": total_possible_score,
            "correct_count": correct_count,
            "wrong_count": wrong_count,
            "unanswered_count": unanswered_count,
            "accuracy_percentage": accuracy,
            "passed": passed,
            "points_earned": points_awarded,
            "time_taken_seconds": submission.time_taken_seconds,
            "is_duplicate": is_duplicate,
            "created_at": now
        }
        await db.quiz_attempts.insert_one(attempt_doc)

        # Update quiz attempts counter
        await db.quizzes.update_one(
            {"_id": submission.quiz_id},
            {"$inc": {"attempts_count": 1}}
        )

        # Fraud check for suspicious completion speed
        await FraudService.check_quiz_speed(
            user_id, submission.quiz_id, submission.time_taken_seconds, len(questions)
        )

        if points_awarded > 0:
            # Credit points to wallet
            await WalletService.add_points(
                user_id=user_id,
                amount=points_awarded,
                tx_type="EARN",
                description=f"Passed Quiz: {quiz['title']} ({accuracy}% accuracy)",
                ref_type="quiz",
                ref_id=submission.quiz_id
            )

            # Update user stats
            user_update_fields: Dict[str, Any] = {"$inc": {"quizzes_completed": 1}}
            if accuracy >= 100.0:
                user_update_fields["$inc"]["perfect_quizzes"] = 1
            await db.users.update_one({"_id": user_id}, user_update_fields)

            # Send notification
            await NotificationService.create_notification(
                user_id=user_id,
                title="🧠 Quiz Passed!",
                message=f"Great job! You passed '{quiz['title']}' with {accuracy}% accuracy and earned +{points_awarded} points!",
                notification_type="QUIZ",
                action_url="/wallet"
            )

            # Qualify referral if first activity
            await ReferralService.qualify_referral_on_first_activity(user_id)

            # Check achievements
            await AchievementService.check_and_unlock(user_id)

            # Check rapid point accumulation
            await FraudService.check_rapid_point_accumulation(user_id)

        msg = f"🎉 Quiz Passed! You earned +{points_awarded} points." if passed else "Quiz completed. Keep practicing to reach the passing score!"
        if is_duplicate and passed:
            msg = f"Quiz Completed! (Practice Attempt: You already claimed points for passing this quiz previously)."

        return QuizResultResponse(
            attempt_id=attempt_id,
            quiz_id=submission.quiz_id,
            quiz_title=quiz["title"],
            score=score_earned,
            total_score=total_possible_score,
            correct_count=correct_count,
            wrong_count=wrong_count,
            unanswered_count=unanswered_count,
            accuracy_percentage=accuracy,
            passed=passed,
            points_earned=points_awarded,
            time_taken_seconds=submission.time_taken_seconds,
            is_duplicate_attempt=is_duplicate,
            message=msg,
            question_reviews=reviews,
            created_at=now
        )
