import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from .base import PaymentProvider, PaymentProviderResult

logger = logging.getLogger("task2cash.providers.demo")

class DemoPaymentProvider(PaymentProvider):
    """
    Production-grade Simulated Sandbox Payment & Recharge Provider.
    Clearly marks all operations as DEMO/SANDBOX with unique simulated references.
    """
    
    def __init__(self):
        self.provider_name = "Task2Cash Sandbox Demo Provider"

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
        short_id = uuid.uuid4().hex[:8].upper()
        demo_tx_id = f"DEMO-RCHG-{operator.upper()[:3]}-{short_id}"
        
        logger.info(
            "[DEMO RECHARGE] Simulating mobile recharge: Number=%s, Operator=%s, Amount=₹%.2f, TX_ID=%s",
            mobile_number[-4:].rjust(len(mobile_number), '*'),
            operator,
            amount_inr,
            demo_tx_id
        )
        
        return PaymentProviderResult(
            success=True,
            transaction_id=demo_tx_id,
            status="COMPLETED",
            provider_name=self.provider_name,
            is_demo=True,
            message=f"Simulated mobile recharge of ₹{amount_inr:.2f} for {operator} ({mobile_number[-4:].rjust(len(mobile_number), '*')}) completed in DEMO mode.",
            metadata={
                "operator": operator,
                "circle": circle,
                "mobile_masked": f"******{mobile_number[-4:]}" if len(mobile_number) >= 4 else mobile_number,
                "amount_inr": amount_inr,
                "points": points,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mode": "DEMO_SANDBOX"
            }
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
        short_id = uuid.uuid4().hex[:8].upper()
        demo_tx_id = f"DEMO-UPI-PAY-{short_id}"
        
        logger.info(
            "[DEMO UPI PAYOUT] Simulating UPI transfer: VPA=%s, Amount=₹%.2f, TX_ID=%s",
            upi_id,
            amount_inr,
            demo_tx_id
        )
        
        return PaymentProviderResult(
            success=True,
            transaction_id=demo_tx_id,
            status="COMPLETED",
            provider_name=self.provider_name,
            is_demo=True,
            message=f"Simulated UPI payout of ₹{amount_inr:.2f} to {upi_id} completed successfully in DEMO mode.",
            metadata={
                "upi_id": upi_id,
                "recipient_name": recipient_name,
                "amount_inr": amount_inr,
                "points": points,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mode": "DEMO_SANDBOX"
            }
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
        short_id = uuid.uuid4().hex[:8].upper()
        demo_tx_id = f"DEMO-NEFT-IMPS-{short_id}"
        
        masked_acc = f"XXXX-XXXX-{account_number[-4:]}" if len(account_number) >= 4 else "XXXX"
        
        logger.info(
            "[DEMO BANK PAYOUT] Simulating Bank Transfer: Bank=%s, IFSC=%s, Acc=%s, Amount=₹%.2f, TX_ID=%s",
            bank_name,
            ifsc_code,
            masked_acc,
            amount_inr,
            demo_tx_id
        )
        
        return PaymentProviderResult(
            success=True,
            transaction_id=demo_tx_id,
            status="COMPLETED",
            provider_name=self.provider_name,
            is_demo=True,
            message=f"Simulated Bank IMPS transfer of ₹{amount_inr:.2f} to {bank_name} ({masked_acc}) completed in DEMO mode.",
            metadata={
                "bank_name": bank_name,
                "ifsc_code": ifsc_code,
                "account_masked": masked_acc,
                "account_holder": account_holder_name,
                "amount_inr": amount_inr,
                "points": points,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "mode": "DEMO_SANDBOX"
            }
        )

    async def check_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        return {
            "transaction_id": transaction_id,
            "status": "COMPLETED",
            "provider": self.provider_name,
            "is_demo": True,
            "checked_at": datetime.now(timezone.utc).isoformat()
        }

    async def refund_transaction(self, transaction_id: str, reason: str) -> bool:
        logger.info("[DEMO REFUND] Simulating refund for %s. Reason: %s", transaction_id, reason)
        return True
