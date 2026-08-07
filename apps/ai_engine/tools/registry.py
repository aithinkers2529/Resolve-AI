import logging
from typing import Dict, Any, List, Callable

logger = logging.getLogger("tool_registry")

# Canonical Tool Permission Matrix
AGENT_TOOL_PERMISSIONS: Dict[str, List[str]] = {
    "InteractionAgent": ["get_customer", "get_order"],
    "EvidenceAgent": ["get_order", "get_delivery", "analyze_vision", "extract_invoice"],
    "PolicyAgent": ["search_policy"],
    "FraudAgent": ["get_customer_history", "get_claim_history"],
    "ResolutionAgent": ["get_order", "check_inventory", "calculate_refund"],
    "WorkflowExecutionAgent": [
        "verify_order", "create_refund", "reserve_inventory",
        "create_shipment", "schedule_pickup", "update_order_status", "send_notification"
    ],
    "EscalationAgent": ["create_escalation", "request_human_review"]
}

class ToolRegistry:
    """Tool Permission Registry: Enforces strict agent-level authorization policies before executing enterprise tools."""

    @staticmethod
    def is_tool_authorized(agent_name: str, tool_name: str) -> bool:
        allowed_tools = AGENT_TOOL_PERMISSIONS.get(agent_name, [])
        return tool_name in allowed_tools

    @staticmethod
    def invoke_tool(agent_name: str, tool_name: str, tool_func: Callable, **kwargs) -> Any:
        if not ToolRegistry.is_tool_authorized(agent_name, tool_name):
            error_msg = f"Security Violation: Agent '{agent_name}' is NOT authorized to execute enterprise tool '{tool_name}'."
            logger.error(error_msg)
            raise PermissionError(error_msg)

        logger.info(f"Tool Permission Granted: Agent '{agent_name}' -> Executing tool '{tool_name}'.")
        return tool_func(**kwargs)
