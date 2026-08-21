from .base import PaymentProvider, PaymentProviderResult
from .demo_provider import DemoPaymentProvider
from .real_provider_placeholder import RealPaymentProviderPlaceholder
from app.core.config import settings

def get_payment_provider() -> PaymentProvider:
    """
    Factory to return active PaymentProvider instance based on settings.
    Defaults to DemoPaymentProvider for safe sandbox simulations.
    """
    if settings.DEMO_MODE:
        return DemoPaymentProvider()
    return RealPaymentProviderPlaceholder()

__all__ = [
    "PaymentProvider",
    "PaymentProviderResult",
    "DemoPaymentProvider",
    "RealPaymentProviderPlaceholder",
    "get_payment_provider",
]
