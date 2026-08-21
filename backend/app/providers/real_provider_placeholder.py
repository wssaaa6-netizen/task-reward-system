"""
Production Payment Provider Placeholder.
This class demonstrates how a live gateway (e.g. RazorpayX, Cashfree Payouts, PlanApi Mobile Recharge)
can be dropped in seamlessly in the future without changing any business or wallet logic.
"""
from typing import Dict, Any
from .base import PaymentProvider, PaymentProviderResult

class RealPaymentProviderPlaceholder(PaymentProvider):
    """
    Placeholder for future live payment gateway integrations.
    To activate live mode:
    1. Provide API credentials in environment variables
    2. Implement HTTP client calls to target payout/recharge vendor API
    3. Update the provider factory in app/providers/__init__.py
    """
    def __init__(self, api_key: str = "", api_secret: str = ""):
        self.api_key = api_key
        self.api_secret = api_secret
        self.provider_name = "Live Gateway Adapter (Not Configured)"

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
        raise NotImplementedError(
            "Real mobile recharge gateway is not configured. Enable DEMO_MODE=true in settings."
        )

    async def create_upi_payout(
        self,
        upi_id: str,
        recipient_name: str,
        amount_inr: float,
        points: int,
        user_id: str,
        withdrawal_id: str
    ) -> PaymentProviderResult:
        raise NotImplementedError(
            "Real UPI payout gateway is not configured. Enable DEMO_MODE=true in settings."
        )

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
        raise NotImplementedError(
            "Real Bank transfer gateway is not configured. Enable DEMO_MODE=true in settings."
        )

    async def check_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        raise NotImplementedError("Real transaction status check is not configured.")

    async def refund_transaction(self, transaction_id: str, reason: str) -> bool:
        raise NotImplementedError("Real transaction refund is not configured.")
