import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database.mongodb import get_database
from app.schemas.social import AchievementItem, AchievementsListResponse
from app.services.notification_service import NotificationService

logger = logging.getLogger("task2cash.services.achievement")

ACHIEVEMENT_DEFINITIONS = [
    {
        "code": "FIRST_TASK",
        "title": "First Step",
        "description": "Complete your first earning task on Task2Cash.",
        "category": "tasks",
        "points_reward": 100,
        "icon": "Target",
        "rarity": "Common",
        "target_value": 1,
        "metric": "tasks_completed",
    },
    {
        "code": "TASK_MASTER",
        "title": "Task Conqueror",
        "description": "Complete 10 tasks across different categories.",
        "category": "tasks",
        "points_reward": 500,
        "icon": "CheckCheck",
        "rarity": "Rare",
        "target_value": 10,
        "metric": "tasks_completed",
    },
    {
        "code": "FIRST_QUIZ",
        "title": "Brain Spark",
        "description": "Complete your first knowledge challenge quiz.",
        "category": "quizzes",
        "points_reward": 100,
        "icon": "Lightbulb",
        "rarity": "Common",
        "target_value": 1,
        "metric": "quizzes_completed",
    },
    {
        "code": "QUIZ_MASTER",
        "title": "Quiz Master",
        "description": "Complete 10 knowledge quizzes with passing score.",
        "category": "quizzes",
        "points_reward": 600,
        "icon": "Brain",
        "rarity": "Epic",
        "target_value": 10,
        "metric": "quizzes_completed",
    },
    {
        "code": "PERFECT_SCORE",
        "title": "Perfectionist",
        "description": "Score 100% accuracy on any timed quiz.",
        "category": "quizzes",
        "points_reward": 250,
        "icon": "Award",
        "rarity": "Rare",
        "target_value": 1,
        "metric": "perfect_quizzes",
    },
    {
        "code": "STREAK_3",
        "title": "Consistency Starter",
        "description": "Maintain an uninterrupted 3-day daily streak.",
        "category": "streak",
        "points_reward": 150,
        "icon": "Zap",
        "rarity": "Common",
        "target_value": 3,
        "metric": "streak_count",
    },
    {
        "code": "STREAK_7",
        "title": "Streak Champion",
        "description": "Reach and maintain a 7-day uninterrupted streak.",
        "category": "streak",
        "points_reward": 500,
        "icon": "Flame",
        "rarity": "Epic",
        "target_value": 7,
        "metric": "streak_count",
    },
    {
        "code": "POINTS_1000",
        "title": "Point Hunter",
        "description": "Accumulate 1,000 total lifetime points.",
        "category": "points",
        "points_reward": 200,
        "icon": "Coins",
        "rarity": "Common",
        "target_value": 1000,
        "metric": "total_earned_points",
    },
    {
        "code": "POINTS_10000",
        "title": "Point Collector",
        "description": "Accumulate 10,000 total lifetime points.",
        "category": "points",
        "points_reward": 1000,
        "icon": "Trophy",
        "rarity": "Legendary",
        "target_value": 10000,
        "metric": "total_earned_points",
    },
    {
        "code": "FIRST_REDEMPTION",
        "title": "First Reward",
        "description": "Redeem your points for a mobile recharge or payout.",
        "category": "rewards",
        "points_reward": 250,
        "icon": "Gift",
        "rarity": "Rare",
        "target_value": 1,
        "metric": "redemptions_count",
    },
    {
        "code": "FIRST_REFERRAL",
        "title": "Social Influencer",
        "description": "Invite a friend who joins and earns points.",
        "category": "social",
        "points_reward": 300,
        "icon": "Users",
        "rarity": "Rare",
        "target_value": 1,
        "metric": "referrals_count",
    },
    {
        "code": "ELITE_MEMBER",
        "title": "Elite Status",
        "description": "Reach Gold, Platinum, or Diamond tier.",
        "category": "level",
        "points_reward": 800,
        "icon": "Crown",
        "rarity": "Legendary",
        "target_value": 5000,
        "metric": "xp",
    }
]

class AchievementService:
    @staticmethod
    async def get_user_achievements(user_id: str) -> AchievementsListResponse:
        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        wallet = await db.wallets.find_one({"user_id": user_id}) or {}
        streak = await db.daily_streaks.find_one({"user_id": user_id}) or {}
        unlocked_docs = await db.user_achievements.find({"user_id": user_id}).to_list(100)
        unlocked_map = {doc["achievement_code"]: doc["unlocked_at"] for doc in unlocked_docs}

        # User metrics
        metrics = {
            "tasks_completed": user.get("tasks_completed", 0) if user else 0,
            "quizzes_completed": user.get("quizzes_completed", 0) if user else 0,
            "perfect_quizzes": user.get("perfect_quizzes", 0) if user else 0,
            "streak_count": streak.get("current_streak", 0),
            "total_earned_points": wallet.get("total_earned", 0),
            "redemptions_count": user.get("redemptions_count", 0) if user else 0,
            "referrals_count": user.get("referrals_count", 0) if user else 0,
            "xp": user.get("xp", 0) if user else 0,
        }

        items: List[AchievementItem] = []
        total_points_awarded = 0
        total_unlocked = 0

        for ach in ACHIEVEMENT_DEFINITIONS:
            code = ach["code"]
            is_unlocked = code in unlocked_map
            unlocked_at = unlocked_map.get(code)
            current_progress = min(metrics.get(ach["metric"], 0), ach["target_value"])
            progress_pct = int((current_progress / ach["target_value"]) * 100) if ach["target_value"] > 0 else 0

            if is_unlocked:
                total_unlocked += 1
                total_points_awarded += ach["points_reward"]
                progress_pct = 100
                current_progress = ach["target_value"]

            items.append(AchievementItem(
                code=code,
                title=ach["title"],
                description=ach["description"],
                category=ach["category"],
                points_reward=ach["points_reward"],
                icon=ach["icon"],
                rarity=ach["rarity"],
                current_progress=current_progress,
                target_value=ach["target_value"],
                progress_percentage=progress_pct,
                is_unlocked=is_unlocked,
                unlocked_at=unlocked_at
            ))

        return AchievementsListResponse(
            total_unlocked=total_unlocked,
            total_achievements=len(ACHIEVEMENT_DEFINITIONS),
            total_points_awarded=total_points_awarded,
            achievements=items
        )

    @staticmethod
    async def check_and_unlock(user_id: str) -> List[str]:
        """
        Evaluate user metrics against achievements and unlock any newly satisfied badges.
        Returns a list of newly unlocked achievement titles.
        """
        from app.services.wallet_service import WalletService

        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        if not user:
            return []

        wallet = await db.wallets.find_one({"user_id": user_id}) or {}
        streak = await db.daily_streaks.find_one({"user_id": user_id}) or {}
        unlocked_docs = await db.user_achievements.find({"user_id": user_id}).to_list(100)
        unlocked_codes = set(doc["achievement_code"] for doc in unlocked_docs)

        metrics = {
            "tasks_completed": user.get("tasks_completed", 0),
            "quizzes_completed": user.get("quizzes_completed", 0),
            "perfect_quizzes": user.get("perfect_quizzes", 0),
            "streak_count": streak.get("current_streak", 0),
            "total_earned_points": wallet.get("total_earned", 0),
            "redemptions_count": user.get("redemptions_count", 0),
            "referrals_count": user.get("referrals_count", 0),
            "xp": user.get("xp", 0),
        }

        newly_unlocked = []
        now = datetime.now(timezone.utc)

        for ach in ACHIEVEMENT_DEFINITIONS:
            code = ach["code"]
            if code in unlocked_codes:
                continue

            current_val = metrics.get(ach["metric"], 0)
            if current_val >= ach["target_value"]:
                # Unlock achievement
                await db.user_achievements.insert_one({
                    "user_id": user_id,
                    "achievement_code": code,
                    "points_reward": ach["points_reward"],
                    "unlocked_at": now
                })
                unlocked_codes.add(code)
                newly_unlocked.append(ach["title"])

                # Award achievement bonus points
                await WalletService.add_points(
                    user_id=user_id,
                    amount=ach["points_reward"],
                    tx_type="BONUS",
                    description=f"Achievement Unlocked: {ach['title']}",
                    ref_type="achievement",
                    ref_id=code
                )

                # Send notification
                await NotificationService.create_notification(
                    user_id=user_id,
                    title=f"🏆 Achievement Unlocked: {ach['title']}!",
                    message=f"Congratulations! You unlocked '{ach['title']}' and earned +{ach['points_reward']} bonus points!",
                    notification_type="ACHIEVEMENT",
                    action_url="/achievements"
                )

        return newly_unlocked
