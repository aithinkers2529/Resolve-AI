from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class DisputeBase(BaseModel):
    customer_name: str
    customer_email: EmailStr
    order_id: str
    claim_amount: float
    complaint_text: str
    evidence_urls: Optional[List[str]] = []

class DisputeCreate(DisputeBase):
    pass

class DisputeUpdate(BaseModel):
    status: Optional[str] = None
    fraud_score: Optional[float] = None
    policy_notes: Optional[str] = None
    resolution_action: Optional[str] = None

class DisputeResponse(DisputeBase):
    id: str
    status: str
    fraud_score: float
    policy_notes: Optional[str] = None
    resolution_action: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AgentLogResponse(BaseModel):
    id: str
    dispute_id: str
    agent_name: str
    action_taken: str
    log_details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
