import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    PROJECT_NAME: str = "Task2Cash – Earn Points & Redeem Rewards"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "task2cash"
    
    # Security / JWT
    JWT_SECRET: str = "task2cash_super_secret_jwt_key_development_2026_gamification_rewards"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 120
    JWT_REFRESH_EXPIRE_DAYS: int = 7
    
    # Initial Admin Configuration
    ADMIN_EMAIL: str = "admin@task2cash.com"
    ADMIN_PASSWORD: str = "Admin@123456"
    ADMIN_NAME: str = "Platform Administrator"
    
    # Platform Behavior
    DEMO_MODE: bool = True
    DEFAULT_CONVERSION_RATE: int = 100  # 100 points = 1 INR
    MIN_WITHDRAWAL_POINTS: int = 5000   # 5000 points = 50 INR
    DAILY_WITHDRAWAL_LIMIT_POINTS: int = 50000
    MONTHLY_WITHDRAWAL_LIMIT_POINTS: int = 200000
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://frontend-gray-five-63.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            cleaned = v.strip()
            if cleaned.startswith("[") and cleaned.endswith("]"):
                cleaned = cleaned[1:-1]
            return [
                i.strip().strip("'\"").rstrip("/")
                for i in cleaned.split(",")
                if i.strip().strip("'\"")
            ]
        elif isinstance(v, list):
            return [str(i).strip().strip("'\"").rstrip("/") for i in v if i]
        return ["*"]


settings = Settings()
