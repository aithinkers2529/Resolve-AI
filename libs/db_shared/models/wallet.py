from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, default=lambda: f"WAL-{str(uuid.uuid4())[:8].upper()}")
    customer_id = Column(String, nullable=False, unique=True, index=True)
    customer_email = Column(String, nullable=False, index=True)
    balance = Column(Float, default=0.0)
    pending_refunds = Column(Float, default=0.0)
    total_refunded = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: f"TXN-{str(uuid.uuid4())[:8].upper()}")
    customer_id = Column(String, nullable=False, index=True)
    customer_email = Column(String, nullable=False)
    order_id = Column(String, nullable=True, index=True)
    dispute_id = Column(String, nullable=True, index=True)
    type = Column(String, nullable=False)  # PAYMENT, REFUND, CREDIT, DEBIT, ADJUSTMENT
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="COMPLETED")  # COMPLETED, PENDING, FAILED
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
