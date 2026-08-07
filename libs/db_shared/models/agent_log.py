from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dispute_id = Column(String, ForeignKey("disputes.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name = Column(String, nullable=False, index=True) # e.g. CustomerInteractionAgent, PolicyIntelligenceAgent
    action_taken = Column(String, nullable=False)
    log_details = Column(String, nullable=True) # JSON or long string details
    created_at = Column(DateTime(timezone=True), server_default=func.now())
