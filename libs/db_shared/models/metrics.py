from sqlalchemy import Column, String, DateTime, Float, Integer
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class AgentMetric(Base):
    __tablename__ = "agent_metrics"

    id = Column(String, primary_key=True, default=lambda: f"MTR-{str(uuid.uuid4())[:8].upper()}")
    agent_name = Column(String, nullable=False, index=True)
    executions_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    avg_latency_ms = Column(Float, default=0.0)
    p95_latency_ms = Column(Float, default=0.0)
    avg_confidence = Column(Float, default=0.0)
    human_escalation_count = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ToolMetric(Base):
    __tablename__ = "tool_metrics"

    id = Column(String, primary_key=True, default=lambda: f"TLM-{str(uuid.uuid4())[:8].upper()}")
    tool_name = Column(String, nullable=False, index=True)
    agent_name = Column(String, nullable=False)
    invocations_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    avg_latency_ms = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SLARecord(Base):
    __tablename__ = "sla_records"

    id = Column(String, primary_key=True, default=lambda: f"SLA-{str(uuid.uuid4())[:8].upper()}")
    case_id = Column(String, nullable=False, index=True)
    dispute_category = Column(String, nullable=False)
    target_duration_sec = Column(Float, default=120.0)
    actual_duration_sec = Column(Float, default=0.0)
    sla_status = Column(String, default="WITHIN_SLA", index=True) # WITHIN_SLA, AT_RISK, BREACHED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
