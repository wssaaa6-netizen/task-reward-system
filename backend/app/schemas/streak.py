from datetime import datetime, date
from typing import Optional, List, Dict
from pydantic import BaseModel

class DailyStreakDayInfo(BaseModel):
    day: int
    points_reward: int
    is_completed: bool
    is_current: bool
    is_upcoming: bool

class DailyStreakResponse(BaseModel):
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_check_in_date: Optional[str] = None
    can_claim_today: bool = True
    next_claim_points: int = 10
    total_streak_points_earned: int = 0
    days_schedule: List[DailyStreakDayInfo] = []

class StreakClaimResponse(BaseModel):
    streak_count: int
    points_awarded: int
    message: str
    wallet_balance: int
    achievement_unlocked: Optional[str] = None
