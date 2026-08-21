from fastapi import APIRouter, Depends
from app.schemas.social import AchievementsListResponse
from app.schemas.common import APIResponse
from app.services.achievement_service import AchievementService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/achievements", tags=["Achievements & Badges"])

@router.get("", response_model=APIResponse[AchievementsListResponse])
async def get_achievements(current_user: dict = Depends(get_current_user)):
    data = await AchievementService.get_user_achievements(current_user["_id"])
    return APIResponse(success=True, message="Achievements list loaded", data=data)
