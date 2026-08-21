import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.database.mongodb import get_database
from app.schemas.reward import (
    RewardCreate,
    RewardUpdate,
    RewardResponse,
    RedemptionCreate,
    RedemptionResponse,
    RewardStatus,
    RewardType
)
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.services.achievement_service import AchievementService
from app.providers import get_payment_provider

logger = logging.getLogger("task2cash.services.reward")

class RewardService:
    @staticmethod
    async def list_rewards(user_id: Optional[str] = None, category: Optional[str] = None) -> List[RewardResponse]:
        db = get_database()
        query: Dict[str, Any] = {"status": RewardStatus.ACTIVE}
        if category and category != "ALL":
            query["category"] = category

        cursor = db.rewards.find(query).sort("required_points", 1)
        items: List[RewardResponse] = []

        user_points = 0
        if user_id:
            wallet = await db.wallets.find_one({"user_id": user_id})
            if wallet:
                user_points = wallet.get("available_points", 0)

        async for doc in cursor:
            req_pts = doc["required_points"]
            items.append(RewardResponse(
                id=str(doc["_id"]),
                name=doc["name"],
                description=doc["description"],
                type=doc["type"],
                required_points=req_pts,
                demo_cash_value=doc["demo_cash_value"],
                icon_name=doc.get("icon_name", "Gift"),
                image_url=doc.get("image_url"),
                category=doc.get("category", "General"),
                min_level_required=doc.get("min_level_required", "Bronze"),
                daily_limit=doc.get("daily_limit", 5),
                status=doc.get("status", RewardStatus.ACTIVE),
                can_user_afford=user_points >= req_pts,
                created_at=doc.get("created_at", datetime.now(timezone.utc))
            ))

        return items

    @staticmethod
    async def get_reward_by_id(reward_id: str) -> RewardResponse:
        db = get_database()
        doc = await db.rewards.find_one({"_id": reward_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Reward not found")

        return RewardResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            description=doc["description"],
            type=doc["type"],
            required_points=doc["required_points"],
            demo_cash_value=doc["demo_cash_value"],
            icon_name=doc.get("icon_name", "Gift"),
            image_url=doc.get("image_url"),
            category=doc.get("category", "General"),
            min_level_required=doc.get("min_level_required", "Bronze"),
            daily_limit=doc.get("daily_limit", 5),
            status=doc.get("status", RewardStatus.ACTIVE),
            can_user_afford=False,
            created_at=doc.get("created_at", datetime.now(timezone.utc))
        )

    @staticmethod
    async def process_redemption(user_id: str, request: RedemptionCreate) -> RedemptionResponse:
        db = get_database()
        reward = await db.rewards.find_one({"_id": request.reward_id})
        if not reward:
            raise HTTPException(status_code=404, detail="Reward not found")

        if reward.get("status") != RewardStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="This reward is currently out of stock or inactive.")

        required_pts = reward["required_points"]
        demo_val = reward["demo_cash_value"]
        reward_type = reward["type"]
        reward_name = reward["name"]

        # Validate input fields per reward type
        target_display = "Sandbox Demo Account"
        if reward_type == RewardType.MOBILE_RECHARGE:
            if not request.mobile_number or len(request.mobile_number.strip()) < 10:
                raise HTTPException(status_code=400, detail="Please provide a valid 10-digit mobile number for recharge.")
            if not request.operator:
                raise HTTPException(status_code=400, detail="Please select a mobile telecom operator.")
            target_display = f"{request.operator} - ******{request.mobile_number.strip()[-4:]}"
        elif reward_type == RewardType.UPI_PAYOUT:
            if not request.upi_id or "@" not in request.upi_id:
                raise HTTPException(status_code=400, detail="Please provide a valid UPI Virtual Payment Address (e.g. name@upi).")
            target_display = f"UPI: {request.upi_id}"
        elif reward_type == RewardType.BANK_TRANSFER:
            if not request.account_number or not request.ifsc_code:
                raise HTTPException(status_code=400, detail="Please provide complete Bank Account Number and IFSC Code.")
            masked_acc = f"XXXX-XXXX-{request.account_number[-4:]}"
            target_display = f"{request.bank_name or 'Bank'} ({masked_acc})"
        elif reward_type == RewardType.GIFT_CARD:
            if not request.gift_email or "@" not in request.gift_email:
                raise HTTPException(status_code=400, detail="Please provide a valid email address to receive your voucher code.")
            target_display = f"Voucher to {request.gift_email}"

        # 1. Atomic Points Deduction
        redemption_id = str(uuid.uuid4())
        await WalletService.deduct_points(
            user_id=user_id,
            amount=required_pts,
            tx_type="REDEEM",
            description=f"Redeemed: {reward_name} (₹{demo_val} Demo Value)",
            ref_type="redemption",
            ref_id=redemption_id
        )

        # 2. Invoke Payment Provider (Demo Mode)
        provider = get_payment_provider()
        provider_result = None

        if reward_type == RewardType.MOBILE_RECHARGE:
            provider_result = await provider.create_mobile_recharge(
                mobile_number=request.mobile_number or "9999999999",
                operator=request.operator or "Jio",
                circle=request.circle or "India",
                amount_inr=demo_val,
                points=required_pts,
                user_id=user_id,
                redemption_id=redemption_id
            )
        elif reward_type == RewardType.UPI_PAYOUT:
            provider_result = await provider.create_upi_payout(
                upi_id=request.upi_id or "user@upi",
                recipient_name="Demo User",
                amount_inr=demo_val,
                points=required_pts,
                user_id=user_id,
                withdrawal_id=redemption_id
            )
        else:
            provider_result = await provider.create_bank_payout(
                account_holder_name=request.account_holder_name or "Demo User",
                account_number=request.account_number or "1234567890",
                ifsc_code=request.ifsc_code or "SBIN0001234",
                bank_name=request.bank_name or "Demo Bank",
                amount_inr=demo_val,
                points=required_pts,
                user_id=user_id,
                withdrawal_id=redemption_id
            )

        now = datetime.now(timezone.utc)
        tx_id = provider_result.transaction_id if provider_result else f"DEMO-TX-{uuid.uuid4().hex[:8].upper()}"

        # 3. Save Redemption Document
        redemption_doc = {
            "_id": redemption_id,
            "user_id": user_id,
            "reward_id": request.reward_id,
            "reward_name": reward_name,
            "reward_type": reward_type,
            "points_spent": required_pts,
            "demo_cash_value": demo_val,
            "status": "COMPLETED",
            "transaction_id": tx_id,
            "target_destination": target_display,
            "is_demo": True,
            "provider_metadata": provider_result.metadata if provider_result else {},
            "created_at": now,
            "completed_at": now
        }
        await db.redemptions.insert_one(redemption_doc)

        # 4. Increment user redemption count
        await db.users.update_one(
            {"_id": user_id},
            {"$inc": {"redemptions_count": 1}}
        )

        # 5. Dispatch notification
        await NotificationService.create_notification(
            user_id=user_id,
            title="🎁 Reward Redeemed Successfully!",
            message=f"Your redemption for {reward_name} (₹{demo_val:.2f} Demo Value) has been simulated with Ref ID: {tx_id}.",
            notification_type="REWARD",
            action_url="/wallet"
        )

        # 6. Check achievements
        await AchievementService.check_and_unlock(user_id)

        return RedemptionResponse(
            id=redemption_id,
            user_id=user_id,
            reward_id=request.reward_id,
            reward_name=reward_name,
            reward_type=reward_type,
            points_spent=required_pts,
            demo_cash_value=demo_val,
            status="COMPLETED",
            transaction_id=tx_id,
            target_destination=target_display,
            is_demo=True,
            demo_disclaimer="DEMO TRANSACTION – No real money was transferred.",
            created_at=now,
            completed_at=now
        )

    @staticmethod
    async def get_user_redemptions(user_id: str, limit: int = 30) -> List[RedemptionResponse]:
        db = get_database()
        cursor = db.redemptions.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        results = []
        async for doc in cursor:
            results.append(RedemptionResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                reward_id=doc["reward_id"],
                reward_name=doc["reward_name"],
                reward_type=doc["reward_type"],
                points_spent=doc["points_spent"],
                demo_cash_value=doc["demo_cash_value"],
                status=doc["status"],
                transaction_id=doc["transaction_id"],
                target_destination=doc["target_destination"],
                is_demo=doc.get("is_demo", True),
                admin_notes=doc.get("admin_notes"),
                created_at=doc["created_at"],
                completed_at=doc.get("completed_at")
            ))
        return results
