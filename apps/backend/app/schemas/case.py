from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

class CaseCreateRequest(BaseModel):
    customer_name: str
    customer_email: EmailStr
    order_id: str
    category: Optional[str] = "Damaged Product"
    claim_amount: float
    complaint_text: str
    evidence_urls: Optional[List[str]] = []

class CaseUpdateRequest(BaseModel):
    status: Optional[str] = None
    fraud_score: Optional[float] = None
    policy_reference: Optional[str] = None
    resolution_action: Optional[str] = None
    human_approval_required: Optional[bool] = None

class CaseResponse(BaseModel):
    id: str
    customer_id: Optional[str] = "CUST-1001"
    customer_name: str
    customer_email: str
    order_id: str
    category: str
    claim_amount: float
    complaint_text: str
    status: str
    fraud_score: float
    fraud_risk_level: Optional[str] = "Low"
    fraud_reasons: Optional[List[str]] = []
    policy_eligible: Optional[str] = "Pending"
    policy_reference: Optional[str] = None
    policy_notes: Optional[str] = None
    evidence_urls: Optional[List[str]] = []
    evidence_summary: Optional[Dict[str, Any]] = {}
    ocr_text: Optional[str] = None
    resolution_action: Optional[str] = None
    resolution_reason: Optional[str] = None
    confidence: float
    human_approval_required: Optional[bool] = False
    created_at: datetime

    class Config:
        from_attributes = True
