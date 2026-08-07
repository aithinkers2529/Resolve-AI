from typing import TypedDict, List, Dict, Any, Optional

class ComplaintState(TypedDict):
    complaint_id: str
    customer_name: str
    customer_email: str
    customer_history_count: int
    complaint_text: str
    category: str
    claim_amount: float
    evidence_urls: List[str]
    
    # Agent Outcomes
    ocr_text: Optional[str]
    evidence_summary: Optional[Dict[str, Any]]
    
    fraud_score: float
    fraud_risk_level: str
    fraud_reasons: List[str]
    
    policy_eligible: str
    policy_reference: Optional[str]
    policy_notes: Optional[str]
    
    resolution_action: Optional[str] # Refund, Replacement, Reject, Escalate
    resolution_reason: Optional[str]
    confidence: float
    
    status: str
    human_approval_required: bool
    agent_logs: List[Dict[str, Any]]
    last_active_agent: Optional[str]
