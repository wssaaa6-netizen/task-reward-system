import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from app.database.mongodb import get_database
from app.schemas.withdrawal import (
    WithdrawalCreate,
    WithdrawalResponse,
    WithdrawalStatus,
    WithdrawalMethod,
    WithdrawalActionRequest
)
from app.services.settings_service import SettingsService
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.providers import get_payment_provider

logger = logging.getLogger("task2cash.services.withdrawal")

class WithdrawalService:
    @staticmethod
    async def request_withdrawal(user_id: str, request: WithdrawalCreate) -> WithdrawalResponse:
        db = get_database()
        settings = await SettingsService.get_settings()
        min_pts = settings.min_withdrawal_points or 5000
        daily_limit = settings.daily_withdrawal_limit_points or 50000

        if request.points < min_pts:
            req_inr = await SettingsService.points_to_inr(min_pts)
            raise HTTPException(
                status_code=400,
                detail=f"Minimum withdrawal is {min_pts:,} points (₹{req_inr:.2f} Demo Value)."
            )

        # Check daily withdrawal total
        now = datetime.now(timezone.utc)
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_of_today},
                    "status": {"$ne": WithdrawalStatus.REJECTED}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "total_today": {"$sum": "$points"}
                }
            }
        ]
        agg_res = await db.withdrawals.aggregate(pipeline).to_list(1)
        today_total = agg_res[0]["total_today"] if agg_res else 0
        if (today_total + request.points) > daily_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Daily withdrawal limit of {daily_limit:,} points exceeded. You have already requested {today_total:,} points today."
            )

        amount_inr = await SettingsService.points_to_inr(request.points)
        withdrawal_id = str(uuid.uuid4())

        # Validate destination details and mask
        if request.method == WithdrawalMethod.UPI:
            if not request.upi_id or "@" not in request.upi_id:
                raise HTTPException(status_code=400, detail="A valid UPI ID is required for UPI payout.")
            destination_display = f"UPI: {request.upi_id}"
            dest_data = {
                "upi_id": request.upi_id,
                "upi_name": request.upi_name or "User"
            }
        else:
            if not request.account_number or not request.ifsc_code or not request.account_holder_name:
                raise HTTPException(status_code=400, detail="Account Holder Name, Account Number, and IFSC are required for Bank Transfer.")
            
            raw_acc = request.account_number.strip()
            masked_acc = f"XXXX-XXXX-{raw_acc[-4:]}" if len(raw_acc) >= 4 else "XXXX"
            destination_display = f"{request.bank_name or 'Bank'} ({masked_acc})"
            dest_data = {
                "account_holder_name": request.account_holder_name,
                "account_number_masked": masked_acc,
                "ifsc_code": request.ifsc_code.upper().strip(),
                "bank_name": request.bank_name or "Commercial Bank"
            }

        # 1. Deduct points from wallet
        await WalletService.deduct_points(
            user_id=user_id,
            amount=request.points,
            tx_type="REDEEM",
            description=f"Withdrawal Request: ₹{amount_inr:.2f} via {request.method} (Demo)",
            ref_type="withdrawal",
            ref_id=withdrawal_id
        )

        # 2. In Sandbox mode, automatically simulate demo processing
        provider = get_payment_provider()
        if request.method == WithdrawalMethod.UPI:
            prov_res = await provider.create_upi_payout(
                upi_id=dest_data["upi_id"],
                recipient_name=dest_data["upi_name"],
                amount_inr=amount_inr,
                points=request.points,
                user_id=user_id,
                withdrawal_id=withdrawal_id
            )
        else:
            prov_res = await provider.create_bank_payout(
                account_holder_name=dest_data["account_holder_name"],
                account_number="0000000000",
                ifsc_code=dest_data["ifsc_code"],
                bank_name=dest_data["bank_name"],
                amount_inr=amount_inr,
                points=request.points,
                user_id=user_id,
                withdrawal_id=withdrawal_id
            )

        tx_id = prov_res.transaction_id if prov_res else f"DEMO-WD-{uuid.uuid4().hex[:8].upper()}"

        user = await db.users.find_one({"_id": user_id})

        # 3. Create Withdrawal record
        doc = {
            "_id": withdrawal_id,
            "user_id": user_id,
            "user_name": user.get("full_name") if user else "User",
            "user_email": user.get("email") if user else "user@task2cash.com",
            "method": request.method,
            "points": request.points,
            "amount_inr": amount_inr,
            "destination_display": destination_display,
            "destination_data": dest_data,
            "status": WithdrawalStatus.COMPLETED,
            "transaction_id": tx_id,
            "is_demo": True,
            "created_at": now,
            "updated_at": now
        }
        await db.withdrawals.insert_one(doc)

        # 4. Notify user
        await NotificationService.create_notification(
            user_id=user_id,
            title="💸 Payout Simulated Successfully!",
            message=f"Your demo payout of ₹{amount_inr:.2f} ({request.points:,} pts) via {request.method} was simulated with Ref ID: {tx_id}.",
            notification_type="REWARD",
            action_url="/withdrawals"
        )

        return WithdrawalResponse(
            id=withdrawal_id,
            user_id=user_id,
            user_name=doc.get("user_name"),
            user_email=doc.get("user_email"),
            method=request.method,
            points=request.points,
            amount_inr=amount_inr,
            destination_display=destination_display,
            status=WithdrawalStatus.COMPLETED,
            transaction_id=tx_id,
            is_demo=True,
            created_at=now,
            updated_at=now
        )

    @staticmethod
    async def get_user_withdrawals(user_id: str, limit: int = 30) -> List[WithdrawalResponse]:
        db = get_database()
        cursor = db.withdrawals.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        results = []
        async for doc in cursor:
            results.append(WithdrawalResponse(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                user_name=doc.get("user_name"),
                user_email=doc.get("user_email"),
                method=doc["method"],
                points=doc["points"],
                amount_inr=doc["amount_inr"],
                destination_display=doc["destination_display"],
                status=doc["status"],
                transaction_id=doc["transaction_id"],
                is_demo=doc.get("is_demo", True),
                admin_notes=doc.get("admin_notes"),
                created_at=doc["created_at"],
                updated_at=doc.get("updated_at")
            ))
        return results

    @staticmethod
    async def admin_process_withdrawal(withdrawal_id: str, action: WithdrawalActionRequest) -> WithdrawalResponse:
        db = get_database()
        doc = await db.withdrawals.find_one({"_id": withdrawal_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Withdrawal not found")

        current_status = doc["status"]
        new_status = action.status.upper()
        now = datetime.now(timezone.utc)

        if new_status == WithdrawalStatus.REJECTED and current_status != WithdrawalStatus.REJECTED:
            # Refund points back to user wallet!
            await WalletService.add_points(
                user_id=doc["user_id"],
                amount=doc["points"],
                tx_type="REFUND",
                description=f"Refund: Withdrawal rejected ({action.admin_notes or 'Declined by Admin'})",
                ref_type="withdrawal",
                ref_id=withdrawal_id
            )
            await NotificationService.create_notification(
                user_id=doc["user_id"],
                title="⚠️ Withdrawal Refunded",
                message=f"Your withdrawal of {doc['points']:,} points has been refunded back to your wallet. Reason: {action.admin_notes or 'Admin review'}.",
                notification_type="SYSTEM",
                action_url="/wallet"
            )

        await db.withdrawals.update_one(
            {"_id": withdrawal_id},
            {
                "$set": {
                    "status": new_status,
                    "admin_notes": action.admin_notes,
                    "updated_at": now
                }
            }
        )

        return WithdrawalResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            user_name=doc.get("user_name"),
            user_email=doc.get("user_email"),
            method=doc["method"],
            points=doc["points"],
            amount_inr=doc["amount_inr"],
            destination_display=doc["destination_display"],
            status=new_status,
            transaction_id=doc["transaction_id"],
            is_demo=doc.get("is_demo", True),
            admin_notes=action.admin_notes,
            created_at=doc["created_at"],
            updated_at=now
        )
