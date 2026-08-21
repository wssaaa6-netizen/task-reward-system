import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.database.mongodb import get_database
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskSubmissionCreate,
    TaskSubmissionResponse,
    TaskStatus,
)
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.services.referral_service import ReferralService
from app.services.achievement_service import AchievementService
from app.services.fraud_service import FraudService

logger = logging.getLogger("task2cash.services.task")

class TaskService:
    @staticmethod
    def _sanitize_interactive_data(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not data:
            return None
        safe = {k: v for k, v in data.items() if k not in ("correct_option_index", "expected_answer")}
        return safe

    @staticmethod
    async def list_tasks(
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        status: str = TaskStatus.ACTIVE
    ) -> List[TaskResponse]:
        db = get_database()
        query: Dict[str, Any] = {}
        if status and status != "ALL":
            query["status"] = status
        if category and category != "ALL":
            # Support matching by category string
            query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        if difficulty and difficulty != "ALL":
            query["difficulty"] = {"$regex": f"^{difficulty}$", "$options": "i"}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}}
            ]

        cursor = db.tasks.find(query).sort("created_at", -1)
        tasks_list = []

        # Get completed task ids for user
        user_completed_task_ids = set()
        user_submissions_map = {}
        if user_id:
            user_subs = await db.task_submissions.find({"user_id": user_id}).to_list(500)
            for sub in user_subs:
                user_completed_task_ids.add(sub["task_id"])
                user_submissions_map[sub["task_id"]] = sub.get("status", "COMPLETED")

        async for doc in cursor:
            task_id = str(doc["_id"])
            is_completed = task_id in user_completed_task_ids
            sub_status = user_submissions_map.get(task_id)

            tasks_list.append(TaskResponse(
                id=task_id,
                title=doc["title"],
                description=doc["description"],
                category=doc.get("category", "Quick Tasks"),
                difficulty=doc.get("difficulty", "Easy"),
                points=doc["points"],
                time_limit_minutes=doc.get("time_limit_minutes", 2),
                instructions=doc.get("instructions", []),
                requirements=doc.get("requirements"),
                verification_type=doc.get("verification_type", "AUTO"),
                interactive_data=TaskService._sanitize_interactive_data(doc.get("interactive_data")),
                is_daily=doc.get("is_daily", False),
                image_url=doc.get("image_url"),
                external_url=doc.get("external_url"),
                max_completions=doc.get("max_completions", 1000),
                completions_count=doc.get("completions_count", 0),
                status=doc.get("status", TaskStatus.ACTIVE),
                is_completed_by_user=is_completed,
                user_submission_status=sub_status,
                created_at=doc.get("created_at", datetime.now(timezone.utc))
            ))

        return tasks_list

    @staticmethod
    async def get_task_by_id(task_id: str, user_id: Optional[str] = None) -> TaskResponse:
        db = get_database()
        doc = await db.tasks.find_one({"_id": task_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Task not found")

        is_completed = False
        sub_status = None
        if user_id:
            sub = await db.task_submissions.find_one({"user_id": user_id, "task_id": task_id})
            if sub:
                is_completed = True
                sub_status = sub.get("status", "COMPLETED")

        return TaskResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            description=doc["description"],
            category=doc.get("category", "Quick Tasks"),
            difficulty=doc.get("difficulty", "Easy"),
            points=doc["points"],
            time_limit_minutes=doc.get("time_limit_minutes", 2),
            instructions=doc.get("instructions", []),
            requirements=doc.get("requirements"),
            verification_type=doc.get("verification_type", "AUTO"),
            interactive_data=TaskService._sanitize_interactive_data(doc.get("interactive_data")),
            is_daily=doc.get("is_daily", False),
            image_url=doc.get("image_url"),
            external_url=doc.get("external_url"),
            max_completions=doc.get("max_completions", 1000),
            completions_count=doc.get("completions_count", 0),
            status=doc.get("status", TaskStatus.ACTIVE),
            is_completed_by_user=is_completed,
            user_submission_status=sub_status,
            created_at=doc.get("created_at", datetime.now(timezone.utc))
        )

    @staticmethod
    async def get_daily_summary(user_id: Optional[str] = None) -> Dict[str, Any]:
        db = get_database()
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        # Get all active tasks
        all_active_tasks = await db.tasks.find({"status": TaskStatus.ACTIVE}).to_list(200)
        total_active = len(all_active_tasks)

        user_completed_ids = set()
        today_completed_count = 0
        daily_bonus_claimed = False

        if user_id:
            user_subs = await db.task_submissions.find({"user_id": user_id}).to_list(500)
            for sub in user_subs:
                user_completed_ids.add(sub["task_id"])
                created_at = sub.get("created_at")
                if created_at and created_at >= start_of_today:
                    today_completed_count += 1

            # Check if daily bonus transaction exists for today
            bonus_tx = await db.point_transactions.find_one({
                "user_id": user_id,
                "reference_type": f"daily_bonus_{today_str}"
            })
            daily_bonus_claimed = (bonus_tx is not None)

        # Calculate today's available points dynamically
        today_available_points = sum(
            t["points"] for t in all_active_tasks if str(t["_id"]) not in user_completed_ids
        )

        # Select top 6 quick tasks
        quick_tasks_raw = [
            t for t in all_active_tasks
            if t.get("difficulty") == "Easy" or t.get("is_daily") or t.get("category") in ("Quick Tasks", "Daily Challenges", "Knowledge")
        ]
        if not quick_tasks_raw:
            quick_tasks_raw = all_active_tasks[:6]

        quick_tasks = []
        for doc in quick_tasks_raw[:8]:
            t_id = str(doc["_id"])
            quick_tasks.append({
                "id": t_id,
                "title": doc["title"],
                "description": doc["description"],
                "category": doc.get("category", "Quick Tasks"),
                "difficulty": doc.get("difficulty", "Easy"),
                "points": doc["points"],
                "time_limit_minutes": doc.get("time_limit_minutes", 2),
                "is_completed": (t_id in user_completed_ids),
                "is_daily": doc.get("is_daily", False)
            })

        return {
            "today_completed_count": today_completed_count,
            "daily_bonus_target": 3,
            "daily_bonus_points": 300,
            "daily_bonus_claimed": daily_bonus_claimed,
            "today_available_points": today_available_points,
            "total_active_tasks": total_active,
            "quick_tasks": quick_tasks
        }

    @staticmethod
    async def submit_task(user_id: str, submission: TaskSubmissionCreate) -> TaskSubmissionResponse:
        db = get_database()
        task = await db.tasks.find_one({"_id": submission.task_id})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if task.get("status") != TaskStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="This task is currently inactive or expired.")

        # Check maximum completions
        if task.get("completions_count", 0) >= task.get("max_completions", 1000):
            raise HTTPException(status_code=400, detail="This task has reached its maximum completion quota.")

        # Anti-duplicate completion check
        existing = await db.task_submissions.find_one({
            "user_id": user_id,
            "task_id": submission.task_id
        })
        if existing:
            raise HTTPException(
                status_code=400,
                detail="You have already completed this task! Each task can only be completed once."
            )

        # Interactive Verification Checks
        v_type = task.get("verification_type", "AUTO")
        interactive_data = task.get("interactive_data") or {}

        if v_type in ("INTERACTIVE_QUIZ", "TRUE_FALSE") and "correct_option_index" in interactive_data:
            expected_idx = interactive_data["correct_option_index"]
            if submission.selected_option_index is None or submission.selected_option_index != expected_idx:
                raise HTTPException(
                    status_code=400,
                    detail="Incorrect answer! Please review the prompt and select the correct option."
                )

        if v_type in ("TEXT_ANSWER", "CODE_SUBMIT") and "expected_answer" in interactive_data:
            expected = str(interactive_data["expected_answer"]).strip().lower()
            user_ans = str(submission.text_answer or submission.text_proof or "").strip().lower()
            if expected and expected not in user_ans:
                raise HTTPException(
                    status_code=400,
                    detail=f"Verification check failed: Your answer did not match the expected pattern. Hint: {interactive_data.get('hint', 'Please check instructions.')}"
                )

        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        sub_id = str(uuid.uuid4())
        points_to_award = task["points"]

        sub_doc = {
            "_id": sub_id,
            "user_id": user_id,
            "task_id": submission.task_id,
            "task_title": task["title"],
            "points_awarded": points_to_award,
            "status": "APPROVED",
            "text_proof": submission.text_proof or submission.text_answer,
            "link_proof": submission.link_proof,
            "selected_option_index": submission.selected_option_index,
            "answers": submission.answers,
            "created_at": now
        }
        await db.task_submissions.insert_one(sub_doc)

        # Increment completions counter on task
        await db.tasks.update_one(
            {"_id": submission.task_id},
            {"$inc": {"completions_count": 1}}
        )

        # Credit points to user wallet
        await WalletService.add_points(
            user_id=user_id,
            amount=points_to_award,
            tx_type="EARN",
            description=f"Completed Task: {task['title']} (+{points_to_award} pts)",
            ref_type="task",
            ref_id=submission.task_id
        )

        # Update user total tasks completed count
        await db.users.update_one(
            {"_id": user_id},
            {"$inc": {"tasks_completed": 1}}
        )

        # Send notification
        await NotificationService.create_notification(
            user_id=user_id,
            title="🎯 Task Completed!",
            message=f"Awesome work! You completed '{task['title']}' and earned +{points_to_award} points!",
            notification_type="TASK",
            action_url="/wallet"
        )

        # Check today's completed task count for 3-Task Daily Bonus
        today_subs_count = await db.task_submissions.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": start_of_today}
        })

        daily_bonus_awarded = 0
        if today_subs_count >= 3:
            existing_bonus = await db.point_transactions.find_one({
                "user_id": user_id,
                "reference_type": f"daily_bonus_{today_str}"
            })
            if not existing_bonus:
                daily_bonus_awarded = 300
                await WalletService.add_points(
                    user_id=user_id,
                    amount=300,
                    tx_type="BONUS",
                    description=f"🎁 Daily 3-Task Bonus Completed! (+300 pts)",
                    ref_type=f"daily_bonus_{today_str}",
                    ref_id=today_str
                )
                await NotificationService.create_notification(
                    user_id=user_id,
                    title="🎉 Daily Bonus Unlocked!",
                    message=f"Congratulations! You completed 3 tasks today and earned a +300 bonus points reward!",
                    notification_type="SYSTEM",
                    action_url="/wallet"
                )

        # Qualify referral if this was referee's first activity
        await ReferralService.qualify_referral_on_first_activity(user_id)

        # Evaluate achievement unlocks
        await AchievementService.check_and_unlock(user_id)

        # Fraud heuristic check
        await FraudService.check_rapid_point_accumulation(user_id)

        # Get updated wallet balance
        wallet = await WalletService.get_or_create_wallet(user_id)

        return TaskSubmissionResponse(
            id=sub_id,
            user_id=user_id,
            task_id=submission.task_id,
            task_title=task["title"],
            points_awarded=points_to_award,
            status="APPROVED",
            text_proof=submission.text_proof or submission.text_answer,
            link_proof=submission.link_proof,
            daily_bonus_awarded=daily_bonus_awarded,
            daily_tasks_completed_count=today_subs_count,
            daily_bonus_target=3,
            new_wallet_balance=wallet.get("available_points", 0),
            created_at=now
        )

