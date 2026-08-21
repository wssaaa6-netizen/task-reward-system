from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re

class WithdrawalMethod:
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"

class WithdrawalStatus:
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class WithdrawalCreate(BaseModel):
    method: str = Field(default=WithdrawalMethod.UPI)
    points: int = Field(..., ge=1000)
    
    # UPI Fields
    upi_id: Optional[str] = None
    upi_name: Optional[str] = None
    
    # Bank Fields
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None

    @field_validator("upi_id")
    def validate_upi(cls, v, values):
        if v and "@" not in v:
            raise ValueError("Invalid UPI ID format. Expected user@bank")
        return v

    @field_validator("ifsc_code")
    def validate_ifsc(cls, v):
        if v:
            v_upper = v.upper().strip()
            if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", v_upper):
                raise ValueError("Invalid IFSC code format (e.g., SBIN0001234)")
            return v_upper
        return v

class WithdrawalActionRequest(BaseModel):
    status: str  # COMPLETED, REJECTED, PROCESSING
    admin_notes: Optional[str] = None

class WithdrawalResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    method: str
    points: int
    amount_inr: float
    destination_display: str  # Masked UPI/Bank account
    status: str
    transaction_id: str
    is_demo: bool = True
    demo_disclaimer: str = "DEMO WITHDRAWAL – Simulated transaction for demonstration."
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
