import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.database.mongodb import get_database
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    AuthResponse,
    UserRole,
)
from app.services.wallet_service import WalletService, calculate_level_and_next_xp
from app.services.streak_service import StreakService
from app.services.referral_service import ReferralService
from app.services.notification_service import NotificationService
from app.services.settings_service import SettingsService

logger = logging.getLogger("task2cash.services.auth")

class AuthService:
    @staticmethod
    async def register(user_data: UserRegister) -> AuthResponse:
        db = get_database()
        
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match."
            )

        # Check existing email
        normalized_email = user_data.email.lower().strip()
        existing = await db.users.find_one({"email": normalized_email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

        now = datetime.now(timezone.utc)
        user_id = str(uuid.uuid4())
        hashed_pw = get_password_hash(user_data.password)

        # Create user document
        user_doc = {
            "_id": user_id,
            "full_name": user_data.full_name.strip(),
            "email": normalized_email,
            "mobile": user_data.mobile.strip() if user_data.mobile else None,
            "password_hash": hashed_pw,
            "role": UserRole.USER,
            "status": "ACTIVE",
            "level": "Bronze",
            "xp": 0,
            "points": 0,
            "streak_count": 0,
            "tasks_completed": 0,
            "quizzes_completed": 0,
            "perfect_quizzes": 0,
            "redemptions_count": 0,
            "referrals_count": 0,
            "avatar_url": None,
            "referred_by": None,
            "created_at": now,
            "updated_at": now
        }

        await db.users.insert_one(user_doc)

        # Create unique referral code for new user
        ref_code = await ReferralService.create_user_referral_code(user_id)
        user_doc["referral_code"] = ref_code

        # Initialize user wallet
        await WalletService.get_or_create_wallet(user_id)
        
        # Initialize daily streak record
        await StreakService.get_or_create_streak(user_id)

        # Process referral code if provided
        if user_data.referral_code:
            await ReferralService.process_referral_signup(user_id, user_data.referral_code)

        # Award welcome bonus points
        sys_settings = await SettingsService.get_settings()
        welcome_pts = sys_settings.welcome_bonus_points
        if welcome_pts > 0:
            await WalletService.add_points(
                user_id=user_id,
                amount=welcome_pts,
                tx_type="BONUS",
                description=f"🎉 Welcome Bonus (+{welcome_pts} points)",
                ref_type="welcome"
            )

        # Welcome notification
        await NotificationService.create_notification(
            user_id=user_id,
            title="🎉 Welcome to Task2Cash!",
            message=f"Your account is ready! We've added {welcome_pts} points to your wallet to get you started.",
            notification_type="SYSTEM",
            action_url="/tasks"
        )

        # Generate tokens
        access_token = create_access_token(user_id, extra_claims={"role": UserRole.USER})
        refresh_token = create_refresh_token(user_id)

        user_response = await AuthService.format_user_response(user_id)

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
            user=user_response
        )

    @staticmethod
    async def login(credentials: UserLogin) -> AuthResponse:
        db = get_database()
        normalized_email = credentials.email.lower().strip()
        user = await db.users.find_one({"email": normalized_email})

        if not user or not verify_password(credentials.password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if user.get("status") == "SUSPENDED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended. Please contact support."
            )

        user_id = str(user["_id"])
        role = user.get("role", UserRole.USER)

        access_token = create_access_token(user_id, extra_claims={"role": role})
        refresh_token = create_refresh_token(user_id)

        user_response = await AuthService.format_user_response(user_id)

        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_EXPIRE_MINUTES * 60,
            user=user_response
        )

    @staticmethod
    async def refresh_tokens(refresh_token: str) -> Dict[str, Any]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token."
            )

        user_id = payload.get("sub")
        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        if not user or user.get("status") == "SUSPENDED":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or suspended."
            )

        role = user.get("role", UserRole.USER)
        new_access_token = create_access_token(user_id, extra_claims={"role": role})
        new_refresh_token = create_refresh_token(user_id)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_ACCESS_EXPIRE_MINUTES * 60
        }

    @staticmethod
    async def format_user_response(user_id: str) -> UserResponse:
        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        wallet = await db.wallets.find_one({"user_id": user_id}) or {}
        streak = await db.daily_streaks.find_one({"user_id": user_id}) or {}
        sys_settings = await SettingsService.get_settings()

        points = wallet.get("available_points", 0)
        conversion_rate = sys_settings.conversion_rate or 100
        demo_inr = round(points / conversion_rate, 2)
        xp = user.get("xp", 0)
        level, next_xp = calculate_level_and_next_xp(xp, sys_settings)

        return UserResponse(
            id=str(user["_id"]),
            full_name=user.get("full_name", ""),
            email=user.get("email", ""),
            mobile=user.get("mobile"),
            avatar_url=user.get("avatar_url"),
            role=user.get("role", UserRole.USER),
            status=user.get("status", "ACTIVE"),
            level=level,
            xp=xp,
            next_level_xp=next_xp,
            points=points,
            demo_inr_value=demo_inr,
            streak_count=streak.get("current_streak", 0),
            tasks_completed=user.get("tasks_completed", 0),
            quizzes_completed=user.get("quizzes_completed", 0),
            referral_code=user.get("referral_code", ""),
            referred_by=user.get("referred_by"),
            created_at=user.get("created_at", datetime.now(timezone.utc)),
            updated_at=user.get("updated_at")
        )
