from sqlalchemy import Column, String, DateTime, Float, JSON, Text
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class DecisionPassportModel(Base):
    __tablename__ = "decision_passports"

    id = Column(String, primary_key=True, default=lambda: f"PASSPORT-{str(uuid.uuid4())[:8].upper()}")
    dispute_id = Column(String, nullable=False, unique=True, index=True)
    decision = Column(String, nullable=False)  # REPLACEMENT_APPROVED, REFUND_APPROVED, REJECTED, ESCALATED_FOR_REVIEW
    confidence_score = Column(Float, default=0.95)
    fraud_risk_score = Column(Float, default=0.08)
    verified_evidence = Column(JSON, default=dict)
    policy_matched = Column(String, nullable=False)
    policy_clause = Column(Text, nullable=False)
    customer_context = Column(JSON, default=dict)
    alternatives_evaluated = Column(JSON, default=list)
    final_reasoning = Column(Text, nullable=False)
    execution_proof = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
