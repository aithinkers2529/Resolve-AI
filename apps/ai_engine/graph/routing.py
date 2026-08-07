from .state import ComplaintState

def route_after_fraud(state: ComplaintState) -> str:
    """Determine next node based on fraud evaluation."""
    score = state.get("fraud_score", 0.0)
    if score > 0.60:
        return "escalation"
    return "policy"

def route_after_resolution(state: ComplaintState) -> str:
    """Route to direct execution or human escalation based on decision complexity."""
    action = state.get("resolution_action", "")
    if action == "Escalate" or state.get("confidence", 1.0) < 0.80:
        return "escalation"
    return "workflow"
