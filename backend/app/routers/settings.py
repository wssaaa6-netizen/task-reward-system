from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Public System Settings"])

@router.get("/public", response_model=APIResponse[dict])
async def get_public_settings():
    settings = await SettingsService.get_settings()
    return APIResponse(
        success=True,
        message="Public settings loaded",
        data={
            "conversion_rate": settings.conversion_rate,
            "min_withdrawal_points": settings.min_withdrawal_points,
            "demo_mode": settings.demo_mode_active,
            "maintenance_mode": settings.maintenance_mode,
            "referral_bonus_points": settings.referral_bonus_points,
            "welcome_bonus_points": settings.welcome_bonus_points
        }
    )
