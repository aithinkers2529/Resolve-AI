from sqlalchemy import Column, String, DateTime, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class FraudAssessment(Base):
    __tablename__ = "fraud_assessments"

    id = Column(String, primary_key=True, default=lambda: f"FRD-{str(uuid.uuid4())[:8].upper()}")
    dispute_id = Column(String, ForeignKey("disputes.id"), nullable=False, index=True)
    fraud_score = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String, default="LOW") # LOW, MEDIUM, HIGH
    reasons = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
