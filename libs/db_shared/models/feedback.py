from sqlalchemy import Column, String, DateTime, Integer, Text
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class CaseFeedback(Base):
    __tablename__ = "case_feedbacks"

    id = Column(String, primary_key=True, default=lambda: f"FDB-{str(uuid.uuid4())[:8].upper()}")
    case_id = Column(String, nullable=False, index=True)
    customer_email = Column(String, nullable=False)
    rating = Column(Integer, nullable=False) # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CaseAppeal(Base):
    __tablename__ = "case_appeals"

    id = Column(String, primary_key=True, default=lambda: f"APL-{str(uuid.uuid4())[:8].upper()}")
    case_id = Column(String, nullable=False, index=True)
    customer_email = Column(String, nullable=False)
    appeal_reason = Column(Text, nullable=False)
    status = Column(String, default="PENDING", index=True) # PENDING, ACCEPTED, REJECTED
    reviewed_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
