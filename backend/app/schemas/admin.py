from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AdminStatsResponse(BaseModel):
    total_users: int = 0
    active_users_24h: int = 0
    tasks_completed: int = 0
    quizzes_completed: int = 0
    points_distributed: int = 0
    points_redeemed: int = 0
    demo_inr_redeemed: float = 0.0
    pending_withdrawals_count: int = 0
    fraud_alerts_count: int = 0
    conversion_rate: int = 100
    
    # Analytics arrays for charts
    user_growth: List[Dict[str, Any]] = []
    points_flow: List[Dict[str, Any]] = []
    redemptions_by_type: List[Dict[str, Any]] = []
    recent_activity_logs: List[Dict[str, Any]] = []

class AdminUserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None  # USER, ADMIN
    status: Optional[str] = None  # ACTIVE, SUSPENDED
    level: Optional[str] = None
    points_adjustment: Optional[int] = None
    adjustment_reason: Optional[str] = None

class FraudEventResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    event_type: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    reason: str
    details: Optional[Dict[str, Any]] = None
    status: str = "FLAGGED"  # FLAGGED, INVESTIGATING, RESOLVED, DISMISSED
    created_at: datetime

class FraudEventActionRequest(BaseModel):
    status: str  # RESOLVED, DISMISSED, INVESTIGATING
    admin_action: Optional[str] = None  # SUSPEND_USER, WARN_USER, NONE
    resolution_notes: Optional[str] = None

class SystemSettingsSchema(BaseModel):
    conversion_rate: int = Field(default=100, gt=0)  # points per ₹1
    min_withdrawal_points: int = Field(default=5000, ge=1000)
    daily_withdrawal_limit_points: int = Field(default=50000)
    streak_bonus_day_7: int = Field(default=100)
    referral_bonus_points: int = Field(default=250)
    welcome_bonus_points: int = Field(default=50)
    maintenance_mode: bool = False
    demo_mode_active: bool = True
    level_silver_xp: int = 1000
    level_gold_xp: int = 5000
    level_platinum_xp: int = 15000
    level_diamond_xp: int = 50000
