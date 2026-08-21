import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from app.database.mongodb import get_database
from app.schemas.social import LeaderboardEntry, LeaderboardResponse

logger = logging.getLogger("task2cash.services.leaderboard")

class LeaderboardService:
    @staticmethod
    async def get_leaderboard(
        timeframe: str = "global",
        current_user_id: Optional[str] = None,
        limit: int = 50
    ) -> LeaderboardResponse:
        db = get_database()
        
        # Calculate date boundaries for weekly/monthly
        now = datetime.now(timezone.utc)
        filter_date = None
        if timeframe == "weekly":
            filter_date = now - timedelta(days=7)
        elif timeframe == "monthly":
            filter_date = now - timedelta(days=30)

        entries: List[LeaderboardEntry] = []
        user_rank_entry: Optional[LeaderboardEntry] = None

        if filter_date:
            # Aggregate points from transactions in the timeframe
            pipeline = [
                {
                    "$match": {
                        "type": {"$in": ["EARN", "BONUS"]},
                        "created_at": {"$gte": filter_date}
                    }
                },
                {
                    "$group": {
                        "_id": "$user_id",
                        "total_points": {"$sum": "$amount"},
                        "tasks_count": {"$sum": {"$cond": [{"$eq": ["$reference_type", "task"]}, 1, 0]}}
                    }
                },
                {"$sort": {"total_points": -1}},
                {"$limit": limit}
            ]
            ranked_users = await db.point_transactions.aggregate(pipeline).to_list(limit)

            rank = 1
            for item in ranked_users:
                u_id = item["_id"]
                user = await db.users.find_one({"_id": u_id, "role": "USER"})
                if not user:
                    continue

                streak = await db.daily_streaks.find_one({"user_id": u_id}) or {}
                is_current = (u_id == current_user_id)

                entry = LeaderboardEntry(
                    rank=rank,
                    user_id=u_id,
                    name=user.get("full_name", f"Player #{rank}"),
                    avatar_url=user.get("avatar_url"),
                    level=user.get("level", "Bronze"),
                    points=item["total_points"],
                    tasks_completed=item.get("tasks_count", 0),
                    streak_count=streak.get("current_streak", 0),
                    is_current_user=is_current
                )
                entries.append(entry)
                if is_current:
                    user_rank_entry = entry
                rank += 1

        else:
            # Global Lifetime Leaderboard
            cursor = db.users.find({"role": "USER", "status": "ACTIVE"}).sort("points", -1).limit(limit)
            rank = 1
            async for user in cursor:
                u_id = str(user["_id"])
                streak = await db.daily_streaks.find_one({"user_id": u_id}) or {}
                is_current = (u_id == current_user_id)

                entry = LeaderboardEntry(
                    rank=rank,
                    user_id=u_id,
                    name=user.get("full_name", f"Player #{rank}"),
                    avatar_url=user.get("avatar_url"),
                    level=user.get("level", "Bronze"),
                    points=user.get("points", 0),
                    tasks_completed=user.get("tasks_completed", 0),
                    streak_count=streak.get("current_streak", 0),
                    is_current_user=is_current
                )
                entries.append(entry)
                if is_current:
                    user_rank_entry = entry
                rank += 1

        total_users = await db.users.count_documents({"role": "USER"})

        # If current user is outside top entries, compute personal rank
        if current_user_id and not user_rank_entry:
            curr_user = await db.users.find_one({"_id": current_user_id})
            if curr_user:
                pts = curr_user.get("points", 0)
                better_count = await db.users.count_documents({"role": "USER", "points": {"$gt": pts}})
                user_rank_entry = LeaderboardEntry(
                    rank=better_count + 1,
                    user_id=current_user_id,
                    name=curr_user.get("full_name", "You"),
                    avatar_url=curr_user.get("avatar_url"),
                    level=curr_user.get("level", "Bronze"),
                    points=pts,
                    tasks_completed=curr_user.get("tasks_completed", 0),
                    streak_count=curr_user.get("streak_count", 0),
                    is_current_user=True
                )

        return LeaderboardResponse(
            timeframe=timeframe,
            top_entries=entries,
            current_user_rank=user_rank_entry,
            total_participants=total_users
        )
