from fastapi import APIRouter, Depends
from app.schemas.streak import DailyStreakResponse, StreakClaimResponse
from app.schemas.common import APIResponse
from app.services.streak_service import StreakService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/streak", tags=["Daily Activity Streak"])

@router.get("", response_model=APIResponse[DailyStreakResponse])
async def get_streak_status(current_user: dict = Depends(get_current_user)):
    data = await StreakService.get_streak_info(current_user["_id"])
    return APIResponse(success=True, message="Streak status retrieved", data=data)

@router.post("/claim", response_model=APIResponse[StreakClaimResponse])
async def claim_streak(current_user: dict = Depends(get_current_user)):
    result = await StreakService.claim_daily_streak(current_user["_id"])
    return APIResponse(success=True, message=result.message, data=result)
