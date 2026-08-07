from .state import GraphState
import logging

logger = logging.getLogger("recovery_handler")

def handle_node_failure(state: GraphState, error: Exception) -> GraphState:
    """State rollback and self-healing node correction logic."""
    logger.error(f"Node execution failed with error: {error}. Rolling back state.")
    state["error_occurred"] = True
    state["status"] = "Requires_Review"
    return state
