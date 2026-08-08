from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: f"NOTIF-{str(uuid.uuid4())[:8].upper()}")
    customer_id = Column(String, nullable=False, index=True)
    customer_email = Column(String, nullable=False, index=True)
    dispute_id = Column(String, nullable=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="INFO")  # INFO, DISPUTE_CREATED, EVIDENCE_REQUIRED, ADMIN_APPROVAL, REFUND_ISSUED, REPLACEMENT_SHIPPED, RESOLVED
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
