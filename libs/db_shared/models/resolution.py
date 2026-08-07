from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class ResolutionRecord(Base):
    __tablename__ = "resolution_records"

    id = Column(String, primary_key=True, default=lambda: f"RES-{str(uuid.uuid4())[:8].upper()}")
    dispute_id = Column(String, ForeignKey("disputes.id"), nullable=False, index=True)
    decision = Column(String, nullable=False) # REPLACEMENT, REFUND, REJECT, ESCALATE
    status = Column(String, default="PROPOSED") # PROPOSED, PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED
    reason = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.90)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
