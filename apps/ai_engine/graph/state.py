from typing import TypedDict, List, Dict, Any, Optional

class ComplaintState(TypedDict):
    complaint_id: str
    customer_id: Optional[str]
    customer_name: str
    customer_email: str
    customer_history_count: int
    order_id: Optional[str]
    complaint_text: str
    category: str
    claim_amount: float
    evidence_urls: List[str]
    
    # Coordinator Investigation Plan
    investigation_plan: Optional[Dict[str, Any]]
    
    # Structured Agent Results
    ocr_text: Optional[str]
    evidence_summary: Optional[Dict[str, Any]]
    evidence_result: Optional[Dict[str, Any]]
    policy_result: Optional[Dict[str, Any]]
    fraud_result: Optional[Dict[str, Any]]
    resolution_result: Optional[Dict[str, Any]]
    escalation_result: Optional[Dict[str, Any]]
    execution_result: Optional[Dict[str, Any]]
    
    # Core Indicators
    fraud_score: float
    fraud_risk_level: str
    fraud_reasons: List[str]
    policy_eligible: str
    policy_reference: Optional[str]
    policy_notes: Optional[str]
    resolution_action: Optional[str]
    resolution_reason: Optional[str]
    confidence: float
    
    # Workflow Governance & Trace
    status: str
    human_approval_required: bool
    agent_logs: List[Dict[str, Any]]
    agent_trace: List[Dict[str, Any]]
    last_active_agent: Optional[str]
