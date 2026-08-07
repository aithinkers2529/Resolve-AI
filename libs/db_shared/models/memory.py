from sqlalchemy import Column, String, DateTime, Float, Text
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class CaseMemory(Base):
    __tablename__ = "case_memories"

    id = Column(String, primary_key=True, default=lambda: f"MEM-{str(uuid.uuid4())[:8].upper()}")
    case_id = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    sku = Column(String, nullable=True)
    claim_amount = Column(Float, default=0.0)
    fraud_score = Column(Float, default=0.0)
    policy_ref = Column(String, nullable=True)
    resolution_action = Column(String, nullable=True)
    customer_rating = Column(Float, nullable=True)
    summary_text = Column(Text, nullable=False)
    data_source = Column(String, default="live") # demo_seed, live
    created_at = Column(DateTime(timezone=True), server_default=func.now())
