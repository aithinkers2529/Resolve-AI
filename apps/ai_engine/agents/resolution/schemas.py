from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ResolutionType(str, Enum):
    REFUND = "refund"
    REPLACEMENT = "replacement"
    PARTIAL_REFUND = "partial_refund"
    COUPON = "coupon"
    ESCALATION = "escalation"
    REJECT = "reject"

class DecisionStatus(str, Enum):
    AUTO_APPROVED = "AUTO_APPROVED"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    REJECTED = "REJECTED"

class CandidateOption(BaseModel):
    type: ResolutionType
    name: str
    score: float = Field(ge=0.0, le=100.0)
    eligible: bool = True
    reasoning: str

class StructuredResolutionAnalysis(BaseModel):
    recommended_resolution: ResolutionType
    confidence: float = Field(ge=0.0, le=100.0)
    decision_status: DecisionStatus
    human_review_required: bool = False
    human_review_reason: Optional[str] = None
    reasoning: List[str]
    alternatives: List[CandidateOption]
