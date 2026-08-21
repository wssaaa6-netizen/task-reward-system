from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class TransactionType:
    EARN = "EARN"
    BONUS = "BONUS"
    REDEEM = "REDEEM"
    REFUND = "REFUND"
    ADJUSTMENT = "ADJUSTMENT"
    PENALTY = "PENALTY"

class TransactionStatus:
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class PointTransactionResponse(BaseModel):
    id: str
    user_id: str
    amount: int
    balance_after: int
    type: str
    status: str = TransactionStatus.COMPLETED
    description: str
    reference_type: Optional[str] = None  # task, quiz, streak, referral, redemption, withdrawal, admin
    reference_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

class WalletResponse(BaseModel):
    user_id: str
    available_points: int = 0
    total_earned: int = 0
    total_spent: int = 0
    pending_points: int = 0
    locked_points: int = 0
    conversion_rate: int = 100  # points per 1 INR
    demo_inr_value: float = 0.0
    updated_at: Optional[datetime] = None

class AdminPointsAdjustment(BaseModel):
    user_id: str
    amount: int  # positive to add, negative to deduct
    reason: str = Field(..., min_length=3, max_length=200)
    type: str = TransactionType.ADJUSTMENT
