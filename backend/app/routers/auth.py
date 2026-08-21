from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import (
    UserRegister,
    UserLogin,
    TokenRefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    AuthResponse,
    UserResponse,
)
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=APIResponse[AuthResponse])
async def register(data: UserRegister):
    auth_data = await AuthService.register(data)
    return APIResponse(
        success=True,
        message="Registration successful! Welcome to Task2Cash.",
        data=auth_data
    )

@router.post("/login", response_model=APIResponse[AuthResponse])
async def login(credentials: UserLogin):
    auth_data = await AuthService.login(credentials)
    return APIResponse(
        success=True,
        message="Login successful.",
        data=auth_data
    )

@router.post("/refresh", response_model=APIResponse[dict])
async def refresh_tokens(data: TokenRefreshRequest):
    tokens = await AuthService.refresh_tokens(data.refresh_token)
    return APIResponse(
        success=True,
        message="Tokens refreshed successfully.",
        data=tokens
    )

@router.get("/me", response_model=APIResponse[UserResponse])
async def get_current_profile(current_user: dict = Depends(get_current_user)):
    user_res = await AuthService.format_user_response(current_user["_id"])
    return APIResponse(
        success=True,
        message="Profile fetched.",
        data=user_res
    )

@router.post("/forgot-password", response_model=APIResponse[dict])
async def forgot_password(data: ForgotPasswordRequest):
    # Safe demo response (does not leak email existence)
    return APIResponse(
        success=True,
        message="If this email is registered, password reset instructions have been sent.",
        data={"email": data.email}
    )

@router.post("/reset-password", response_model=APIResponse[dict])
async def reset_password(data: ResetPasswordRequest):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    return APIResponse(
        success=True,
        message="Password has been reset successfully. Please log in with your new password.",
        data={}
    )
