from sqlalchemy.orm import Session
from libs.db_shared.repositories.wallet_repo import WalletRepository
from libs.db_shared.repositories.dispute_repo import DisputeRepository
from libs.db_shared.models.audit import AuditLog
from typing import Dict, Any, List

class WalletService:
    def __init__(self, db: Session):
        self.db = db
        self.wallet_repo = WalletRepository(db)
        self.dispute_repo = DisputeRepository(db)

    def get_customer_wallet(self, customer_email: str) -> Dict[str, Any]:
        wallet = self.wallet_repo.get_or_create_wallet(
            customer_id=f"CUST-{abs(hash(customer_email)) % 10000:04d}",
            customer_email=customer_email
        )
        txns = self.wallet_repo.get_transactions_for_customer(customer_email, limit=30)
        return {
            "id": wallet.id,
            "customer_id": wallet.customer_id,
            "customer_email": wallet.customer_email,
            "balance": wallet.balance,
            "pending_refunds": wallet.pending_refunds,
            "total_refunded": wallet.total_refunded,
            "currency": wallet.currency,
            "transactions": [
                {
                    "id": t.id,
                    "type": t.type,
                    "amount": t.amount,
                    "currency": t.currency,
                    "status": t.status,
                    "description": t.description,
                    "order_id": t.order_id,
                    "dispute_id": t.dispute_id,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                } for t in txns
            ]
        }

    def process_refund(
        self,
        dispute_id: str,
        amount: float,
        operator_email: str = "system@resolve.ai",
        reason: str = "Dispute resolution refund authorized"
    ) -> Dict[str, Any]:
        dispute = self.dispute_repo.get_by_id(dispute_id)
        if not dispute:
            raise ValueError(f"Dispute {dispute_id} not found")

        # Atomic update
        wallet = self.wallet_repo.credit_refund(
            customer_id=dispute.customer_id or f"CUST-1001",
            customer_email=dispute.customer_email,
            amount=amount,
            description=f"Refund credited for Order {dispute.order_id} ({dispute.category}) - {reason}",
            order_id=dispute.order_id,
            dispute_id=dispute.id
        )

        # Update dispute
        dispute.status = "RESOLVED"
        dispute.resolution_action = "Refund"
        dispute.resolution_reason = reason
        self.db.commit()

        # Audit
        audit = AuditLog(
            operator=operator_email,
            action="REFUND_ISSUED",
            details=f"Refund of INR {amount:,.2f} processed and credited to wallet for dispute {dispute_id}."
        )
        self.db.add(audit)
        self.db.commit()

        return {
            "success": True,
            "dispute_id": dispute.id,
            "amount_refunded": amount,
            "new_wallet_balance": wallet.balance,
            "status": "COMPLETED"
        }
