import logging
import uuid
from datetime import datetime, timezone, timedelta, date
from typing import Dict, Any, List
from fastapi import HTTPException
from app.database.mongodb import get_database
from app.schemas.streak import DailyStreakResponse, StreakClaimResponse, DailyStreakDayInfo
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.services.achievement_service import AchievementService

logger = logging.getLogger("task2cash.services.streak")

STREAK_LADDER = [
    {"day": 1, "points": 50},
    {"day": 2, "points": 75},
    {"day": 3, "points": 100},
    {"day": 4, "points": 125},
    {"day": 5, "points": 150},
    {"day": 6, "points": 200},
    {"day": 7, "points": 500},
]

class StreakService:
    @staticmethod
    async def get_or_create_streak(user_id: str) -> Dict[str, Any]:
        db = get_database()
        streak = await db.daily_streaks.find_one({"user_id": user_id})
        if not streak:
            streak = {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "current_streak": 0,
                "longest_streak": 0,
                "last_claim_date": None,
                "total_streak_points": 0,
                "history": [],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            try:
                await db.daily_streaks.insert_one(streak)
            except Exception:
                streak = await db.daily_streaks.find_one({"user_id": user_id})
        return streak

    @staticmethod
    async def get_streak_info(user_id: str) -> DailyStreakResponse:
        streak = await StreakService.get_or_create_streak(user_id)
        now_date = datetime.now(timezone.utc).date()
        last_date_str = streak.get("last_claim_date")

        current_streak = streak.get("current_streak", 0)
        can_claim_today = True
        
        if last_date_str:
            last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
            if last_date == now_date:
                can_claim_today = False
            elif last_date < (now_date - timedelta(days=1)):
                # Missed a day: next claim will reset streak back to 1
                current_streak = 0

        # Current cycle position (1 to 7)
        cycle_day = (current_streak % 7)
        if can_claim_today:
            next_day_index = cycle_day  # 0 to 6
        else:
            next_day_index = (cycle_day - 1) % 7 if cycle_day > 0 else 6

        next_reward = STREAK_LADDER[cycle_day]["points"] if cycle_day < 7 else 10

        # Build 7-day visual schedule
        schedule: List[DailyStreakDayInfo] = []
        active_day_num = (current_streak % 7) if not can_claim_today else (current_streak % 7) + 1
        if active_day_num == 0:
            active_day_num = 7

        for item in STREAK_LADDER:
            day_num = item["day"]
            is_completed = (day_num <= (current_streak % 7)) if not can_claim_today else (day_num < active_day_num)
            is_current = (day_num == active_day_num)
            is_upcoming = (day_num > active_day_num)

            schedule.append(DailyStreakDayInfo(
                day=day_num,
                points_reward=item["points"],
                is_completed=is_completed,
                is_current=is_current,
                is_upcoming=is_upcoming
            ))

        return DailyStreakResponse(
            user_id=user_id,
            current_streak=current_streak,
            longest_streak=streak.get("longest_streak", 0),
            last_check_in_date=last_date_str,
            can_claim_today=can_claim_today,
            next_claim_points=next_reward,
            total_streak_points_earned=streak.get("total_streak_points", 0),
            days_schedule=schedule
        )

    @staticmethod
    async def claim_daily_streak(user_id: str) -> StreakClaimResponse:
        db = get_database()
        streak = await StreakService.get_or_create_streak(user_id)
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")
        now_date = now.date()

        last_date_str = streak.get("last_claim_date")
        current_streak = streak.get("current_streak", 0)

        if last_date_str:
            last_date = datetime.strptime(last_date_str, "%Y-%m-%d").date()
            if last_date == now_date:
                raise HTTPException(status_code=400, detail="You have already claimed your daily streak reward today! Check back tomorrow.")
            elif last_date == (now_date - timedelta(days=1)):
                # Consecutive day
                new_streak = current_streak + 1
            else:
                # Missed day(s) -> restart streak
                new_streak = 1
        else:
            # First claim ever
            new_streak = 1

        # Calculate reward based on day position (1 to 7)
        day_in_cycle = ((new_streak - 1) % 7) + 1
        reward_entry = next((item for item in STREAK_LADDER if item["day"] == day_in_cycle), STREAK_LADDER[0])
        points_awarded = reward_entry["points"]

        longest = max(streak.get("longest_streak", 0), new_streak)
        total_streak_points = streak.get("total_streak_points", 0) + points_awarded

        # Update database streak
        await db.daily_streaks.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "current_streak": new_streak,
                    "longest_streak": longest,
                    "last_claim_date": today_str,
                    "total_streak_points": total_streak_points,
                    "updated_at": now
                },
                "$push": {
                    "history": {
                        "claimed_at": now,
                        "day_number": new_streak,
                        "points_earned": points_awarded
                    }
                }
            }
        )

        # Update user streak count
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"streak_count": new_streak}}
        )

        # Add points to wallet
        await WalletService.add_points(
            user_id=user_id,
            amount=points_awarded,
            tx_type="BONUS",
            description=f"🔥 Day {day_in_cycle} Streak Reward (+{points_awarded} pts)",
            ref_type="streak",
            ref_id=today_str
        )

        # Notify user
        await NotificationService.create_notification(
            user_id=user_id,
            title="🔥 Daily Streak Claimed!",
            message=f"You earned +{points_awarded} points for your Day {new_streak} streak! Keep the flame alive!",
            notification_type="STREAK",
            action_url="/streak"
        )

        # Check for streak achievements (e.g. STREAK_3, STREAK_7)
        unlocked = await AchievementService.check_and_unlock(user_id)
        achievement_msg = f" Also unlocked: {', '.join(unlocked)}" if unlocked else None

        wallet = await WalletService.get_or_create_wallet(user_id)

        return StreakClaimResponse(
            streak_count=new_streak,
            points_awarded=points_awarded,
            message=f"Successfully claimed Day {day_in_cycle} reward (+{points_awarded} points)!{achievement_msg or ''}",
            wallet_balance=wallet.get("available_points", 0),
            achievement_unlocked=unlocked[0] if unlocked else None
        )
