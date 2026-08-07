from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    operator = Column(String, nullable=False, index=True) # User email or agent name
    action = Column(String, nullable=False) # e.g. CLAIM_APPROVED, CLAIM_BYPASS_FRAUD
    ip_address = Column(String, nullable=True)
    details = Column(String, nullable=True) # Masked audit description
    created_at = Column(DateTime(timezone=True), server_default=func.now())
