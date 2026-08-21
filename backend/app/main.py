import logging
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.security import get_password_hash
from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.services.settings_service import SettingsService
from app.services.wallet_service import WalletService
from app.services.streak_service import StreakService
from app.services.referral_service import ReferralService
from app.schemas.user import UserRole
from app.routers import (
    auth_router,
    users_router,
    tasks_router,
    quizzes_router,
    wallet_router,
    rewards_router,
    redemptions_router,
    withdrawals_router,
    streak_router,
    referrals_router,
    leaderboard_router,
    achievements_router,
    notifications_router,
    admin_router,
    settings_router,
    ws_router,
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("task2cash.app")

async def initialize_admin_account():
    """Ensure the system default administrator account exists."""
    db = get_database()
    admin_email = settings.ADMIN_EMAIL.lower().strip()
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_id = str(uuid.uuid4())
        hashed_pw = get_password_hash(settings.ADMIN_PASSWORD)
        now = datetime.now(timezone.utc)

        admin_doc = {
            "_id": admin_id,
            "full_name": settings.ADMIN_NAME,
            "email": admin_email,
            "mobile": "9999999999",
            "password_hash": hashed_pw,
            "role": UserRole.ADMIN,
            "status": "ACTIVE",
            "level": "Diamond",
            "xp": 100000,
            "points": 50000,
            "streak_count": 30,
            "tasks_completed": 50,
            "quizzes_completed": 25,
            "perfect_quizzes": 15,
            "redemptions_count": 0,
            "referrals_count": 0,
            "avatar_url": None,
            "created_at": now,
            "updated_at": now
        }
        await db.users.insert_one(admin_doc)
        await ReferralService.create_user_referral_code(admin_id)
        await WalletService.get_or_create_wallet(admin_id)
        await StreakService.get_or_create_streak(admin_id)
        logger.info("Default Administrator initialized: %s", admin_email)

async def ensure_default_catalog():
    """Ensure baseline catalog (rewards, tasks, quizzes) exists if empty in production without deleting any existing data."""
    db = get_database()
    now = datetime.now(timezone.utc)

    # 1. Rewards
    rewards_count = await db.rewards.count_documents({})
    if rewards_count == 0:
        from seed import REWARDS_DATA
        for rew_data in REWARDS_DATA:
            r_id = str(uuid.uuid4())
            doc = {
                "_id": r_id,
                **rew_data,
                "created_at": now,
                "updated_at": now
            }
            await db.rewards.insert_one(doc)
        logger.info("Auto-seeded %d baseline rewards into catalog.", len(REWARDS_DATA))

    # 2. Tasks
    tasks_count = await db.tasks.count_documents({})
    if tasks_count == 0:
        from seed import TASKS_DATA
        for task_data in TASKS_DATA:
            t_id = str(uuid.uuid4())
            doc = {
                "_id": t_id,
                **task_data,
                "completions_count": 0,
                "created_at": now,
                "updated_at": now
            }
            await db.tasks.insert_one(doc)
        logger.info("Auto-seeded %d baseline tasks into catalog.", len(TASKS_DATA))

    # 3. Quizzes
    quizzes_count = await db.quizzes.count_documents({})
    if quizzes_count == 0:
        from seed import QUIZZES_DATA
        for quiz_data in QUIZZES_DATA:
            q_id = str(uuid.uuid4())
            processed_questions = []
            for idx, q in enumerate(quiz_data["questions"]):
                q_copy = dict(q)
                q_copy["id"] = f"q_{idx+1}_{uuid.uuid4().hex[:6]}"
                processed_questions.append(q_copy)
            doc = {
                "_id": q_id,
                "title": quiz_data["title"],
                "description": quiz_data["description"],
                "category": quiz_data["category"],
                "difficulty": quiz_data["difficulty"],
                "duration_seconds": quiz_data["duration_seconds"],
                "passing_score_percentage": quiz_data["passing_score_percentage"],
                "questions": processed_questions,
                "status": "ACTIVE",
                "cover_image": None,
                "attempts_count": 0,
                "created_at": now,
                "updated_at": now
            }
            await db.quizzes.insert_one(doc)
        logger.info("Auto-seeded %d baseline quizzes into catalog.", len(QUIZZES_DATA))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting %s v%s...", settings.PROJECT_NAME, settings.VERSION)
    await connect_to_mongo()
    await SettingsService.get_settings()
    await initialize_admin_account()
    await ensure_default_catalog()
    yield
    # Shutdown
    await close_mongo_connection()
    logger.info("Task2Cash API shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-quality REST & WebSocket API for Task2Cash gamified rewards platform (Demo Sandbox Mode).",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Unified Error Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            "data": None,
            "error_code": f"HTTP_{exc.status_code}"
        },
        headers=exc.headers
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "Validation error: " + "; ".join([f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in errors])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": msg,
            "data": None,
            "error_code": "VALIDATION_ERROR"
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled Exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected server error occurred. Please try again later.",
            "data": None,
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

# Root status route
@app.get("/", tags=["Health"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "demo_mode": settings.DEMO_MODE,
        "documentation": "/docs"
    }

# Register API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(quizzes_router, prefix="/api")
app.include_router(wallet_router, prefix="/api")
app.include_router(rewards_router, prefix="/api")
app.include_router(redemptions_router, prefix="/api")
app.include_router(withdrawals_router, prefix="/api")
app.include_router(streak_router, prefix="/api")
app.include_router(referrals_router, prefix="/api")
app.include_router(leaderboard_router, prefix="/api")
app.include_router(achievements_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(ws_router, prefix="/api")
