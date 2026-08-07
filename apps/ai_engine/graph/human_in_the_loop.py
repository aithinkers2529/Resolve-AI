from .state import GraphState

def request_human_review(state: GraphState, reason: str) -> GraphState:
    """Halts execution path and exposes state variables for manual dashboard review."""
    state["status"] = "Requires_Review"
    state["human_action_required"] = True
    state["policy_notes"] = f"Review requested: {reason}"
    return state
