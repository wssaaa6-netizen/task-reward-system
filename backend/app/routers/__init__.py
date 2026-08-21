from .auth import router as auth_router
from .users import router as users_router
from .tasks import router as tasks_router
from .quizzes import router as quizzes_router
from .wallet import router as wallet_router
from .rewards import router as rewards_router
from .redemptions import router as redemptions_router
from .withdrawals import router as withdrawals_router
from .streak import router as streak_router
from .referrals import router as referrals_router
from .leaderboard import router as leaderboard_router
from .achievements import router as achievements_router
from .notifications import router as notifications_router
from .admin import router as admin_router
from .settings import router as settings_router
from .ws import router as ws_router

__all__ = [
    "auth_router",
    "users_router",
    "tasks_router",
    "quizzes_router",
    "wallet_router",
    "rewards_router",
    "redemptions_router",
    "withdrawals_router",
    "streak_router",
    "referrals_router",
    "leaderboard_router",
    "achievements_router",
    "notifications_router",
    "admin_router",
    "settings_router",
    "ws_router",
]
