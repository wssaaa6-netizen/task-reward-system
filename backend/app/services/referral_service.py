import logging
import uuid
import secrets
import string
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.database.mongodb import get_database
from app.schemas.social import ReferralDashboardResponse, ReferralUserItem
from app.services.settings_service import SettingsService
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.services.achievement_service import AchievementService

logger = logging.getLogger("task2cash.services.referral")

def generate_unique_code(prefix: str = "T2C-") -> str:
    alphabet = string.ascii_uppercase + string.digits
    suffix = ''.join(secrets.choice(alphabet) for _ in range(6))
    return f"{prefix}{suffix}"

class ReferralService:
    @staticmethod
    async def create_user_referral_code(user_id: str) -> str:
        db = get_database()
        while True:
            code = generate_unique_code()
            exists = await db.users.find_one({"referral_code": code})
            if not exists:
                await db.users.update_one(
                    {"_id": user_id},
                    {"$set": {"referral_code": code}}
                )
                return code

    @staticmethod
    async def process_referral_signup(referee_id: str, referral_code: str) -> bool:
        """Link new user to the referring user and create referral record."""
        db = get_database()
        if not referral_code:
            return False

        referrer = await db.users.find_one({"referral_code": referral_code.strip().upper()})
        if not referrer:
            logger.info("Invalid referral code '%s' submitted during signup", referral_code)
            return False

        if referrer["_id"] == referee_id:
            logger.warning("Self-referral attempt detected for user: %s", referee_id)
            return False

        now = datetime.now(timezone.utc)
        ref_record = {
            "_id": str(uuid.uuid4()),
            "referrer_id": referrer["_id"],
            "referee_id": referee_id,
            "status": "PENDING",  # PENDING until referee completes first task
            "bonus_awarded": False,
            "points_earned": 0,
            "created_at": now,
            "updated_at": now
        }
        await db.referrals.insert_one(ref_record)
        await db.users.update_one(
            {"_id": referee_id},
            {"$set": {"referred_by": referrer["_id"]}}
        )

        # Notify referrer that a friend joined
        await NotificationService.create_notification(
            user_id=referrer["_id"],
            title="👥 New Referral Joined!",
            message="A friend just joined using your referral code! You'll receive bonus points when they complete their first task.",
            notification_type="SYSTEM",
            action_url="/referrals"
        )
        return True

    @staticmethod
    async def qualify_referral_on_first_activity(referee_id: str) -> None:
        """Triggered when referee finishes first task/quiz: award bonus to referrer and referee."""
        db = get_database()
        ref_record = await db.referrals.find_one({
            "referee_id": referee_id,
            "bonus_awarded": False
        })
        if not ref_record:
            return

        settings = await SettingsService.get_settings()
        bonus_points = settings.referral_bonus_points or 250
        referrer_id = ref_record["referrer_id"]
        now = datetime.now(timezone.utc)

        # Award points to referrer
        await WalletService.add_points(
            user_id=referrer_id,
            amount=bonus_points,
            tx_type="BONUS",
            description=f"🎉 Referral Bonus: A friend completed their first task! (+{bonus_points} pts)",
            ref_type="referral",
            ref_id=referee_id
        )

        # Mark referral as QUALIFIED and awarded
        await db.referrals.update_one(
            {"_id": ref_record["_id"]},
            {
                "$set": {
                    "status": "QUALIFIED",
                    "bonus_awarded": True,
                    "points_earned": bonus_points,
                    "updated_at": now
                }
            }
        )

        # Increment referrer count on user profile
        await db.users.update_one(
            {"_id": referrer_id},
            {"$inc": {"referrals_count": 1}}
        )

        # Send notification to referrer
        await NotificationService.create_notification(
            user_id=referrer_id,
            title="🎁 Referral Bonus Credited!",
            message=f"You earned +{bonus_points} points because your referred friend completed their first activity!",
            notification_type="EARNING",
            action_url="/referrals"
        )

        # Check for achievements on referrer
        await AchievementService.check_and_unlock(referrer_id)

    @staticmethod
    async def get_referral_dashboard(user_id: str) -> ReferralDashboardResponse:
        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        if not user:
            return ReferralDashboardResponse(
                referral_code="",
                referral_url=""
            )

        code = user.get("referral_code")
        if not code:
            code = await ReferralService.create_user_referral_code(user_id)

        settings = await SettingsService.get_settings()
        bonus_per_ref = settings.referral_bonus_points

        # Query all referrals made by this user
        cursor = db.referrals.find({"referrer_id": user_id}).sort("created_at", -1)
        ref_items: List[ReferralUserItem] = []
        total_points = 0
        qualified_count = 0

        async for doc in cursor:
            referee = await db.users.find_one({"_id": doc["referee_id"]})
            ref_name = referee.get("full_name", "User") if referee else "New User"
            ref_email = referee.get("email", "") if referee else ""
            masked_email = ref_email[:3] + "***@" + ref_email.split("@")[-1] if "@" in ref_email else "***"
            
            pts = doc.get("points_earned", 0)
            status = doc.get("status", "PENDING")
            if status == "QUALIFIED":
                qualified_count += 1
                total_points += pts

            ref_items.append(ReferralUserItem(
                referee_name=ref_name,
                referee_email_masked=masked_email,
                joined_date=doc["created_at"],
                status=status,
                points_earned_for_referrer=pts
            ))

        return ReferralDashboardResponse(
            referral_code=code,
            referral_url=f"/register?ref={code}",
            total_referrals=len(ref_items),
            qualified_referrals=qualified_count,
            points_earned=total_points,
            bonus_per_referral=bonus_per_ref,
            referral_list=ref_items
        )
