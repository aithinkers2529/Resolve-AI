from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class LearningInsight(Base):
    __tablename__ = "learning_insights"

    id = Column(String, primary_key=True, default=lambda: f"INS-{str(uuid.uuid4())[:8].upper()}")
    category = Column(String, nullable=False, index=True) # Policy, Fraud, Evidence, Agent, Customer
    title = Column(String, nullable=False)
    insight_text = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    impact_assessment = Column(Text, nullable=True)
    status = Column(String, default="PROPOSED", index=True) # PROPOSED, APPROVED, REJECTED
    reviewed_by = Column(String, nullable=True)
    data_source = Column(String, default="live") # demo_seed, live
    created_at = Column(DateTime(timezone=True), server_default=func.now())
