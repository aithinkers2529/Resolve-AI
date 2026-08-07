from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class DisputeBase(BaseModel):
    title: Optional[str] = None
    customer_name: Optional[str] = "Sarah Jenkins"
    customer_email: Optional[str] = "sarah.j@example.com"
    order_id: str
    category: Optional[str] = "Damaged Product"
    claim_amount: float
    complaint_text: str
    evidence_urls: Optional[List[str]] = []

class DisputeCreate(DisputeBase):
    pass

class DisputeUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    fraud_score: Optional[float] = None
    fraud_risk_level: Optional[str] = None
    policy_notes: Optional[str] = None
    resolution_action: Optional[str] = None
    resolution_reason: Optional[str] = None

class DisputeResponse(DisputeBase):
    id: str
    status: str
    fraud_score: Optional[float] = 0.0
    fraud_risk_level: Optional[str] = "Low"
    fraud_reasons: Optional[List[str]] = []
    policy_eligible: Optional[str] = "Pending"
    policy_reference: Optional[str] = None
    policy_notes: Optional[str] = None
    resolution_action: Optional[str] = None
    resolution_reason: Optional[str] = None
    confidence: Optional[float] = 0.95
    human_approval_required: Optional[bool] = False
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
