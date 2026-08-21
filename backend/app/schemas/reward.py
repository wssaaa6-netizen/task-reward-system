from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class RewardType:
    MOBILE_RECHARGE = "MOBILE_RECHARGE"
    UPI_PAYOUT = "UPI_PAYOUT"
    BANK_TRANSFER = "BANK_TRANSFER"
    GIFT_CARD = "GIFT_CARD"

class RewardStatus:
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    OUT_OF_STOCK = "OUT_OF_STOCK"

class RewardCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=5)
    type: str = Field(default=RewardType.MOBILE_RECHARGE)
    required_points: int = Field(..., gt=0)
    demo_cash_value: float = Field(..., gt=0)
    icon_name: Optional[str] = "Smartphone"
    image_url: Optional[str] = None
    category: Optional[str] = "Recharge"
    min_level_required: Optional[str] = "Bronze"
    daily_limit: int = Field(default=5, gt=0)
    status: str = RewardStatus.ACTIVE

class RewardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    required_points: Optional[int] = None
    demo_cash_value: Optional[float] = None
    icon_name: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    min_level_required: Optional[str] = None
    daily_limit: Optional[int] = None
    status: Optional[str] = None

class RewardResponse(BaseModel):
    id: str
    name: str
    description: str
    type: str
    required_points: int
    demo_cash_value: float
    icon_name: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    min_level_required: str
    daily_limit: int
    status: str
    can_user_afford: bool = False
    created_at: datetime

class RedemptionCreate(BaseModel):
    reward_id: str
    # Specific fields based on reward type
    mobile_number: Optional[str] = None
    operator: Optional[str] = None  # Airtel, Jio, Vi, BSNL
    circle: Optional[str] = None    # State / Telecom Circle
    upi_id: Optional[str] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    gift_email: Optional[str] = None

class RedemptionResponse(BaseModel):
    id: str
    user_id: str
    reward_id: str
    reward_name: str
    reward_type: str
    points_spent: int
    demo_cash_value: float
    status: str
    transaction_id: str
    target_destination: str  # Masked phone/UPI/Bank
    is_demo: bool = True
    demo_disclaimer: str = "DEMO TRANSACTION – No real money was transferred."
    admin_notes: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
