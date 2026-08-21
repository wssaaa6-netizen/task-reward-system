from fastapi import APIRouter, Depends
from app.schemas.social import ReferralDashboardResponse
from app.schemas.common import APIResponse
from app.services.referral_service import ReferralService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/referrals", tags=["Referral Program"])

@router.get("", response_model=APIResponse[ReferralDashboardResponse])
async def get_referrals_dashboard(current_user: dict = Depends(get_current_user)):
    data = await ReferralService.get_referral_dashboard(current_user["_id"])
    return APIResponse(success=True, message="Referral dashboard loaded", data=data)
