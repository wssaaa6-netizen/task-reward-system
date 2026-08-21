from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel

class PaymentProviderResult(BaseModel):
    success: bool
    transaction_id: str
    status: str  # COMPLETED, PROCESSING, FAILED
    provider_name: str
    is_demo: bool = True
    message: str
    metadata: Dict[str, Any] = {}

class PaymentProvider(ABC):
    """
    Abstract Payment & Recharge Provider Interface.
    All monetary and mobile recharge transactions run through this interface.
    """
    @abstractmethod
    async def create_mobile_recharge(
        self,
        mobile_number: str,
        operator: str,
        circle: str,
        amount_inr: float,
        points: int,
        user_id: str,
        redemption_id: str
    ) -> PaymentProviderResult:
        pass

    @abstractmethod
    async def create_upi_payout(
        self,
        upi_id: str,
        recipient_name: str,
        amount_inr: float,
        points: int,
        user_id: str,
        withdrawal_id: str
    ) -> PaymentProviderResult:
        pass

    @abstractmethod
    async def create_bank_payout(
        self,
        account_holder_name: str,
        account_number: str,
        ifsc_code: str,
        bank_name: str,
        amount_inr: float,
        points: int,
        user_id: str,
        withdrawal_id: str
    ) -> PaymentProviderResult:
        pass

    @abstractmethod
    async def check_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def refund_transaction(self, transaction_id: str, reason: str) -> bool:
        pass
