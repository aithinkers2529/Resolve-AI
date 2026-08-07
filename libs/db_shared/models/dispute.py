from sqlalchemy import Column, String, DateTime, Float, JSON, Text, Boolean
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(String, primary_key=True, default=lambda: f"DISP-{str(uuid.uuid4())[:8].upper()}")
    title = Column(String, nullable=True)
    customer_id = Column(String, default="CUST-1001", index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    order_id = Column(String, nullable=False, index=True)
    category = Column(String, default="Damaged Product", index=True) # Damaged Product, Late Delivery, Refund Request, Warranty Claim, Wrong Product
    claim_amount = Column(Float, nullable=False)
    complaint_text = Column(Text, nullable=False)
    status = Column(String, default="New", index=True) # New, Analyzing, Fraud_Hold, Policy_Validation, Requires_Review, Approved, Rejected, Resolved
    
    # AI Evaluations
    fraud_score = Column(Float, default=0.0)
    fraud_risk_level = Column(String, default="Low")
    fraud_reasons = Column(JSON, default=list)
    
    policy_eligible = Column(String, default="Pending")
    policy_reference = Column(Text, nullable=True)
    policy_notes = Column(Text, nullable=True)
    
    evidence_urls = Column(JSON, default=list)
    evidence_summary = Column(JSON, default=dict)
    ocr_text = Column(Text, nullable=True)
    
    resolution_action = Column(String, nullable=True) # Refund, Replacement, Reject, Escalate
    resolution_reason = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    human_approval_required = Column(Boolean, default=False)
    
    # Additional Context
    customer_history_count = Column(Float, default=0) # Previous claims count
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
