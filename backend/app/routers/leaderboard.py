from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.schemas.social import LeaderboardResponse
from app.schemas.common import APIResponse
from app.services.leaderboard_service import LeaderboardService
from app.core.dependencies import get_optional_current_user

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("", response_model=APIResponse[LeaderboardResponse])
async def get_leaderboard(
    timeframe: str = Query("global", pattern="^(global|weekly|monthly)$"),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    user_id = current_user["_id"] if current_user else None
    data = await LeaderboardService.get_leaderboard(
        timeframe=timeframe,
        current_user_id=user_id
    )
    return APIResponse(success=True, message="Leaderboard loaded", data=data)
