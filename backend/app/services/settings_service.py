import logging
from datetime import datetime, timezone
from typing import Dict, Any
from app.database.mongodb import get_database
from app.schemas.admin import SystemSettingsSchema
from app.core.config import settings as app_settings

logger = logging.getLogger("task2cash.services.settings")

DEFAULT_SETTINGS = {
    "conversion_rate": 100,  # 100 points = ₹1
    "min_withdrawal_points": 5000,
    "daily_withdrawal_limit_points": 50000,
    "streak_bonus_day_7": 100,
    "referral_bonus_points": 250,
    "welcome_bonus_points": 50,
    "maintenance_mode": False,
    "demo_mode_active": True,
    "level_silver_xp": 1000,
    "level_gold_xp": 5000,
    "level_platinum_xp": 15000,
    "level_diamond_xp": 50000,
}

class SettingsService:
    @staticmethod
    async def get_settings() -> SystemSettingsSchema:
        db = get_database()
        if db is None:
            return SystemSettingsSchema(**DEFAULT_SETTINGS)

        doc = await db.system_settings.find_one({"key": "global_config"})
        if not doc:
            # Initialize default settings in database
            initial_data = {
                "key": "global_config",
                "values": DEFAULT_SETTINGS,
                "updated_at": datetime.now(timezone.utc)
            }
            await db.system_settings.insert_one(initial_data)
            return SystemSettingsSchema(**DEFAULT_SETTINGS)

        values = doc.get("values", {})
        merged = {**DEFAULT_SETTINGS, **values}
        return SystemSettingsSchema(**merged)

    @staticmethod
    async def update_settings(new_settings: SystemSettingsSchema) -> SystemSettingsSchema:
        db = get_database()
        settings_dict = new_settings.model_dump()
        
        await db.system_settings.update_one(
            {"key": "global_config"},
            {
                "$set": {
                    "values": settings_dict,
                    "updated_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        logger.info("System settings updated: %s", settings_dict)
        return new_settings

    @staticmethod
    async def get_conversion_rate() -> int:
        settings_obj = await SettingsService.get_settings()
        return settings_obj.conversion_rate or 100

    @staticmethod
    async def points_to_inr(points: int) -> float:
        rate = await SettingsService.get_conversion_rate()
        return round(points / rate, 2)

    @staticmethod
    async def inr_to_points(amount_inr: float) -> int:
        rate = await SettingsService.get_conversion_rate()
        return int(amount_inr * rate)
