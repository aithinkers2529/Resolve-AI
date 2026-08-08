from sqlalchemy.orm import Session
from libs.db_shared.models.wallet import Wallet, Transaction
from typing import List, Optional
import uuid

class WalletRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_wallet(self, customer_id: str, customer_email: str) -> Wallet:
        wallet = self.db.query(Wallet).filter(
            (Wallet.customer_id == customer_id) | (Wallet.customer_email == customer_email)
        ).first()
        if not wallet:
            wallet = Wallet(
                customer_id=customer_id,
                customer_email=customer_email,
                balance=0.0,
                pending_refunds=0.0,
                total_refunded=0.0,
                currency="INR"
            )
            self.db.add(wallet)
            self.db.commit()
            self.db.refresh(wallet)
        return wallet

    def get_wallet_by_email(self, customer_email: str) -> Optional[Wallet]:
        return self.db.query(Wallet).filter(Wallet.customer_email == customer_email).first()

    def get_wallet_by_customer_id(self, customer_id: str) -> Optional[Wallet]:
        return self.db.query(Wallet).filter(Wallet.customer_id == customer_id).first()

    def add_transaction(
        self,
        customer_id: str,
        customer_email: str,
        amount: float,
        transaction_type: str,
        description: str,
        order_id: Optional[str] = None,
        dispute_id: Optional[str] = None,
        status: str = "COMPLETED"
    ) -> Transaction:
        txn = Transaction(
            customer_id=customer_id,
            customer_email=customer_email,
            order_id=order_id,
            dispute_id=dispute_id,
            type=transaction_type,
            amount=amount,
            currency="INR",
            status=status,
            description=description
        )
        self.db.add(txn)
        self.db.commit()
        self.db.refresh(txn)
        return txn

    def credit_refund(
        self,
        customer_id: str,
        customer_email: str,
        amount: float,
        description: str,
        order_id: Optional[str] = None,
        dispute_id: Optional[str] = None
    ) -> Wallet:
        wallet = self.get_or_create_wallet(customer_id, customer_email)
        wallet.balance += amount
        wallet.total_refunded += amount
        self.db.commit()
        self.db.refresh(wallet)

        self.add_transaction(
            customer_id=customer_id,
            customer_email=customer_email,
            amount=amount,
            transaction_type="REFUND",
            description=description,
            order_id=order_id,
            dispute_id=dispute_id,
            status="COMPLETED"
        )
        return wallet

    def get_transactions_for_customer(self, customer_email: str, limit: int = 50) -> List[Transaction]:
        return self.db.query(Transaction).filter(
            Transaction.customer_email == customer_email
        ).order_by(Transaction.created_at.desc()).limit(limit).all()

    def get_all_transactions(self, limit: int = 100) -> List[Transaction]:
        return self.db.query(Transaction).order_by(Transaction.created_at.desc()).limit(limit).all()
