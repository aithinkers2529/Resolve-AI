from app.core.config import settings
from .state import ComplaintState

# Centralized Configurable Thresholds
FRAUD_ESCALATION_THRESHOLD = 0.60
LOW_CONFIDENCE_THRESHOLD = 0.80
HIGH_VALUE_THRESHOLD = 50000.0

def route_after_investigation(state: ComplaintState) -> str:
    """Deterministic governance evaluation deciding between automated workflow execution vs human escalation."""
    fraud_score = state.get("fraud_score", 0.0)
    evidence_result = state.get("evidence_result") or {}
    evidence_confidence = evidence_result.get("confidence", 0.90)
    resolution_confidence = state.get("confidence", 0.90)
    policy_eligible = state.get("policy_eligible", "Eligible")
    claim_amount = state.get("claim_amount", 0.0)
    resolution_action = state.get("resolution_action", "")

    is_low_fraud = fraud_score < FRAUD_ESCALATION_THRESHOLD
    is_high_evidence_conf = evidence_confidence >= LOW_CONFIDENCE_THRESHOLD
    is_high_res_conf = resolution_confidence >= LOW_CONFIDENCE_THRESHOLD
    is_policy_eligible = policy_eligible == "Eligible"
    is_normal_value = claim_amount < HIGH_VALUE_THRESHOLD
    is_actionable = any(act in str(resolution_action).lower() for act in ["replace", "replacement", "refund", "partial refund"])

    if (
        is_low_fraud and
        is_high_evidence_conf and
        is_high_res_conf and
        is_policy_eligible and
        is_normal_value and
        is_actionable
    ):
        return "workflow"
    
    return "escalation"
