import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from app.database.mongodb import get_database
from app.schemas.wallet import (
    WalletResponse,
    PointTransactionResponse,
    TransactionType,
    TransactionStatus
)
from app.services.settings_service import SettingsService

logger = logging.getLogger("task2cash.services.wallet")

def calculate_level_and_next_xp(xp: int, settings_obj) -> tuple[str, int]:
    if xp >= settings_obj.level_diamond_xp:
        return "Diamond", settings_obj.level_diamond_xp
    elif xp >= settings_obj.level_platinum_xp:
        return "Platinum", settings_obj.level_diamond_xp
    elif xp >= settings_obj.level_gold_xp:
        return "Gold", settings_obj.level_platinum_xp
    elif xp >= settings_obj.level_silver_xp:
        return "Silver", settings_obj.level_gold_xp
    else:
        return "Bronze", settings_obj.level_silver_xp

class WalletService:
    @staticmethod
    async def get_or_create_wallet(user_id: str) -> Dict[str, Any]:
        db = get_database()
        wallet = await db.wallets.find_one({"user_id": user_id})
        if not wallet:
            wallet = {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "available_points": 0,
                "total_earned": 0,
                "total_spent": 0,
                "pending_points": 0,
                "locked_points": 0,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            try:
                await db.wallets.insert_one(wallet)
            except Exception:
                wallet = await db.wallets.find_one({"user_id": user_id})
        return wallet

    @staticmethod
    async def get_wallet_response(user_id: str) -> WalletResponse:
        wallet = await WalletService.get_or_create_wallet(user_id)
        settings = await SettingsService.get_settings()
        conversion_rate = settings.conversion_rate
        available = wallet.get("available_points", 0)
        demo_inr = round(available / conversion_rate, 2) if conversion_rate > 0 else 0.0

        return WalletResponse(
            user_id=user_id,
            available_points=available,
            total_earned=wallet.get("total_earned", 0),
            total_spent=wallet.get("total_spent", 0),
            pending_points=wallet.get("pending_points", 0),
            locked_points=wallet.get("locked_points", 0),
            conversion_rate=conversion_rate,
            demo_inr_value=demo_inr,
            updated_at=wallet.get("updated_at")
        )

    @staticmethod
    async def add_points(
        user_id: str,
        amount: int,
        tx_type: str = TransactionType.EARN,
        description: str = "Points Credited",
        ref_type: Optional[str] = None,
        ref_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PointTransactionResponse:
        """
        Credit points to user wallet, record immutable transaction,
        and update user XP & level.
        """
        if amount <= 0:
            raise ValueError("Amount must be positive to add points")

        db = get_database()
        now = datetime.now(timezone.utc)
        
        # Ensure wallet exists
        await WalletService.get_or_create_wallet(user_id)

        # Atomic increment on wallet
        res = await db.wallets.find_one_and_update(
            {"user_id": user_id},
            {
                "$inc": {
                    "available_points": amount,
                    "total_earned": amount
                },
                "$set": {"updated_at": now}
            },
            return_document=True
        )

        new_balance = res["available_points"]
        tx_id = str(uuid.uuid4())

        # Create immutable point transaction
        tx_doc = {
            "_id": tx_id,
            "user_id": user_id,
            "amount": amount,
            "balance_after": new_balance,
            "type": tx_type,
            "status": TransactionStatus.COMPLETED,
            "description": description,
            "reference_type": ref_type,
            "reference_id": ref_id,
            "metadata": metadata or {},
            "created_at": now
        }
        await db.point_transactions.insert_one(tx_doc)

        # Update User XP, Points and Level
        user = await db.users.find_one({"_id": user_id})
        if user:
            new_xp = user.get("xp", 0) + amount
            settings = await SettingsService.get_settings()
            new_level, next_xp = calculate_level_and_next_xp(new_xp, settings)

            await db.users.update_one(
                {"_id": user_id},
                {
                    "$set": {
                        "points": new_balance,
                        "xp": new_xp,
                        "level": new_level,
                        "updated_at": now
                    }
                }
            )

        logger.info("[POINTS ADD] User %s credited +%d points. New balance: %d. TX: %s", user_id, amount, new_balance, tx_id)

        return PointTransactionResponse(
            id=tx_id,
            user_id=user_id,
            amount=amount,
            balance_after=new_balance,
            type=tx_type,
            status=TransactionStatus.COMPLETED,
            description=description,
            reference_type=ref_type,
            reference_id=ref_id,
            metadata=metadata,
            created_at=now
        )

    @staticmethod
    async def deduct_points(
        user_id: str,
        amount: int,
        tx_type: str = TransactionType.REDEEM,
        description: str = "Points Redeemed",
        ref_type: Optional[str] = None,
        ref_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PointTransactionResponse:
        """
        Deduct points from user wallet with strict non-negative balance enforcement.
        """
        if amount <= 0:
            raise ValueError("Amount must be positive to deduct points")

        db = get_database()
        now = datetime.now(timezone.utc)
        
        # Atomic deduction only if available_points >= amount
        res = await db.wallets.find_one_and_update(
            {"user_id": user_id, "available_points": {"$gte": amount}},
            {
                "$inc": {
                    "available_points": -amount,
                    "total_spent": amount
                },
                "$set": {"updated_at": now}
            },
            return_document=True
        )

        if not res:
            # Check current balance for accurate error message
            w = await db.wallets.find_one({"user_id": user_id})
            current_bal = w.get("available_points", 0) if w else 0
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient points balance. You have {current_bal} points, but {amount} points are required."
            )

        new_balance = res["available_points"]
        tx_id = str(uuid.uuid4())

        # Create immutable point transaction
        tx_doc = {
            "_id": tx_id,
            "user_id": user_id,
            "amount": -amount,
            "balance_after": new_balance,
            "type": tx_type,
            "status": TransactionStatus.COMPLETED,
            "description": description,
            "reference_type": ref_type,
            "reference_id": ref_id,
            "metadata": metadata or {},
            "created_at": now
        }
        await db.point_transactions.insert_one(tx_doc)

        # Update User points record
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "points": new_balance,
                    "updated_at": now
                }
            }
        )

        logger.info("[POINTS DEDUCT] User %s debited -%d points. New balance: %d. TX: %s", user_id, amount, new_balance, tx_id)

        return PointTransactionResponse(
            id=tx_id,
            user_id=user_id,
            amount=-amount,
            balance_after=new_balance,
            type=tx_type,
            status=TransactionStatus.COMPLETED,
            description=description,
            reference_type=ref_type,
            reference_id=ref_id,
            metadata=metadata,
            created_at=now
        )

    @staticmethod
    async def get_user_transactions(
        user_id: str,
        tx_type: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> tuple[List[PointTransactionResponse], int]:
        db = get_database()
        query: Dict[str, Any] = {"user_id": user_id}
        if tx_type and tx_type != "ALL":
            query["type"] = tx_type

        total = await db.point_transactions.count_documents(query)
        cursor = db.point_transactions.find(query).sort("created_at", -1).skip(skip).limit(limit)

        items = []
        async for doc in cursor:
            items.append(PointTransactionResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                amount=doc["amount"],
                balance_after=doc["balance_after"],
                type=doc["type"],
                status=doc.get("status", TransactionStatus.COMPLETED),
                description=doc["description"],
                reference_type=doc.get("reference_type"),
                reference_id=doc.get("reference_id"),
                metadata=doc.get("metadata"),
                created_at=doc["created_at"]
            ))

        return items, total
