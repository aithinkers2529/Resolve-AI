from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.sql import func
from libs.db_shared.base import Base

class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id = Column(String, primary_key=True) # e.g. POL-402
    category = Column(String, nullable=False, index=True)
    reference = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    rule_action = Column(String, default="ELIGIBLE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
