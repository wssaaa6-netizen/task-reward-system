import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from app.database.mongodb import get_database
from app.schemas.admin import FraudEventResponse

logger = logging.getLogger("task2cash.services.fraud")

class FraudService:
    @staticmethod
    async def record_fraud_event(
        user_id: str,
        event_type: str,
        risk_level: str,  # LOW, MEDIUM, HIGH, CRITICAL
        reason: str,
        details: Optional[Dict[str, Any]] = None
    ) -> str:
        db = get_database()
        event_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        doc = {
            "_id": event_id,
            "user_id": user_id,
            "event_type": event_type,
            "risk_level": risk_level,
            "reason": reason,
            "details": details or {},
            "status": "FLAGGED",
            "created_at": now,
            "updated_at": now
        }
        await db.fraud_events.insert_one(doc)

        logger.warning(
            "[FRAUD ALERT] Risk=%s | User=%s | Type=%s | Reason=%s",
            risk_level, user_id, event_type, reason
        )
        return event_id

    @staticmethod
    async def check_rapid_point_accumulation(user_id: str) -> None:
        """Check if user gained unusual amounts of points in last 10 minutes."""
        db = get_database()
        ten_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=10)

        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "type": {"$in": ["EARN", "BONUS"]},
                    "created_at": {"$gte": ten_mins_ago}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "total_recent_points": {"$sum": "$amount"},
                    "tx_count": {"$sum": 1}
                }
            }
        ]
        results = await db.point_transactions.aggregate(pipeline).to_list(1)
        if results:
            total = results[0]["total_recent_points"]
            count = results[0]["tx_count"]
            if total > 5000:
                await FraudService.record_fraud_event(
                    user_id=user_id,
                    event_type="RAPID_POINT_ACCUMULATION",
                    risk_level="HIGH",
                    reason=f"User accumulated {total} points in {count} transactions within 10 minutes.",
                    details={"points": total, "tx_count": count}
                )

    @staticmethod
    async def check_quiz_speed(user_id: str, quiz_id: str, time_taken_seconds: int, question_count: int) -> None:
        """Flag quiz submissions completed faster than humanly readable."""
        min_expected_time = max(3, question_count * 1)  # At least 1 second per question
        if time_taken_seconds < min_expected_time:
            await FraudService.record_fraud_event(
                user_id=user_id,
                event_type="SUSPICIOUS_QUIZ_COMPLETION_SPEED",
                risk_level="MEDIUM",
                reason=f"Completed a {question_count}-question quiz in only {time_taken_seconds} seconds.",
                details={"quiz_id": quiz_id, "time_taken": time_taken_seconds, "question_count": question_count}
            )

    @staticmethod
    async def get_fraud_events(limit: int = 50, status: Optional[str] = None) -> List[FraudEventResponse]:
        db = get_database()
        query = {}
        if status and status != "ALL":
            query["status"] = status

        cursor = db.fraud_events.find(query).sort("created_at", -1).limit(limit)
        events = []
        async for doc in cursor:
            # Enrich with user details if available
            user = await db.users.find_one({"_id": doc["user_id"]})
            events.append(FraudEventResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                user_name=user.get("full_name") if user else "Unknown",
                user_email=user.get("email") if user else "Unknown",
                event_type=doc["event_type"],
                risk_level=doc["risk_level"],
                reason=doc["reason"],
                details=doc.get("details"),
                status=doc.get("status", "FLAGGED"),
                created_at=doc["created_at"]
            ))
        return events
