from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dispute_id = Column(String, ForeignKey("disputes.id"), nullable=False, index=True)
    agent_name = Column(String, nullable=False, index=True)
    status = Column(String, default="COMPLETED") # PENDING, RUNNING, COMPLETED, FAILED, WAITING_HUMAN
    action_taken = Column(String, nullable=False)
    input_payload = Column(JSON, nullable=True)
    output_payload = Column(JSON, nullable=True)
    log_details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
