from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# --- Referrals ---
class ReferralUserItem(BaseModel):
    referee_name: str
    referee_email_masked: str
    joined_date: datetime
    status: str  # PENDING, QUALIFIED, REWARDED
    points_earned_for_referrer: int

class ReferralDashboardResponse(BaseModel):
    referral_code: str
    referral_url: str
    total_referrals: int = 0
    qualified_referrals: int = 0
    points_earned: int = 0
    bonus_per_referral: int = 250
    referral_list: List[ReferralUserItem] = []

# --- Leaderboard ---
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    avatar_url: Optional[str] = None
    level: str
    points: int
    tasks_completed: int
    streak_count: int
    is_current_user: bool = False

class LeaderboardResponse(BaseModel):
    timeframe: str  # global, weekly, monthly
    top_entries: List[LeaderboardEntry] = []
    current_user_rank: Optional[LeaderboardEntry] = None
    total_participants: int = 0

# --- Achievements ---
class AchievementItem(BaseModel):
    code: str
    title: str
    description: str
    category: str  # tasks, quizzes, streak, points, social
    points_reward: int
    icon: str
    rarity: str  # Common, Rare, Epic, Legendary
    current_progress: int
    target_value: int
    progress_percentage: int
    is_unlocked: bool
    unlocked_at: Optional[datetime] = None

class AchievementsListResponse(BaseModel):
    total_unlocked: int = 0
    total_achievements: int = 0
    total_points_awarded: int = 0
    achievements: List[AchievementItem] = []
