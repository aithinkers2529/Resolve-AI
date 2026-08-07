from sqlalchemy import Column, String, DateTime, Integer, Float
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=lambda: f"CUST-{str(uuid.uuid4())[:8].upper()}")
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    account_age_days = Column(Integer, default=365)
    total_orders_count = Column(Integer, default=5)
    total_claims_count = Column(Integer, default=0)
    risk_rating = Column(String, default="LOW") # LOW, MEDIUM, HIGH
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
