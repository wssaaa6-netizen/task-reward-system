from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class UserRole:
    USER = "USER"
    ADMIN = "ADMIN"

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    referral_code: Optional[str] = Field(None, max_length=30)

    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    mobile: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=300)

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    mobile: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = UserRole.USER
    status: str = "ACTIVE"
    level: str = "Bronze"
    xp: int = 0
    next_level_xp: int = 1000
    points: int = 0
    demo_inr_value: float = 0.0
    streak_count: int = 0
    tasks_completed: int = 0
    quizzes_completed: int = 0
    referral_code: str
    referred_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
