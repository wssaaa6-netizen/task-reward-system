from typing import List
from fastapi import APIRouter, Depends
from app.schemas.withdrawal import WithdrawalCreate, WithdrawalResponse
from app.schemas.common import APIResponse
from app.services.withdrawal_service import WithdrawalService
from app.services.settings_service import SettingsService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/withdrawals", tags=["Withdrawals & Payouts"])

@router.post("", response_model=APIResponse[WithdrawalResponse])
async def request_payout(
    data: WithdrawalCreate,
    current_user: dict = Depends(get_current_user)
):
    result = await WithdrawalService.request_withdrawal(current_user["_id"], data)
    return APIResponse(
        success=True,
        message=f"Demo Payout simulated successfully! Ref ID: {result.transaction_id}",
        data=result
    )

@router.get("/history", response_model=APIResponse[List[WithdrawalResponse]])
async def get_withdrawal_history(current_user: dict = Depends(get_current_user)):
    history = await WithdrawalService.get_user_withdrawals(current_user["_id"])
    return APIResponse(success=True, message="Withdrawal history loaded", data=history)

@router.get("/limits", response_model=APIResponse[dict])
async def get_withdrawal_limits():
    settings = await SettingsService.get_settings()
    rate = settings.conversion_rate
    min_pts = settings.min_withdrawal_points
    min_inr = round(min_pts / rate, 2)
    daily_pts = settings.daily_withdrawal_limit_points
    daily_inr = round(daily_pts / rate, 2)

    return APIResponse(
        success=True,
        message="Withdrawal configuration loaded",
        data={
            "min_withdrawal_points": min_pts,
            "min_withdrawal_inr": min_inr,
            "daily_withdrawal_limit_points": daily_pts,
            "daily_withdrawal_limit_inr": daily_inr,
            "conversion_rate": rate,
            "is_demo_mode": settings.demo_mode_active
        }
    )
