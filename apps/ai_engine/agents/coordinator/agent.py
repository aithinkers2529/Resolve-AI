import logging
import time
from typing import Dict, Any

logger = logging.getLogger("coordinator_agent")

class CoordinatorAgent:
    """Case Coordinator Agent: Analyzes intake details and creates an investigation plan."""
    
    def __init__(self):
        self.name = "Case Coordinator Agent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        complaint_id = state.get("complaint_id", "UNKNOWN")
        claim_amount = state.get("claim_amount", 0.0)
        category = state.get("category", "General Dispute")
        
        logger.info(f"[{self.name}] Building investigation plan for dispute: {complaint_id}")
        
        # Build structured investigation plan
        plan = {
            "case_id": complaint_id,
            "category": category,
            "priority": "HIGH" if claim_amount >= 10000.0 else "NORMAL",
            "tasks": [
                "verify_order",
                "analyze_evidence",
                "check_policy",
                "analyze_fraud",
                "evaluate_resolution",
                "execute_or_escalate"
            ],
            "status": "PLAN_GENERATED"
        }
        
        state["investigation_plan"] = plan
        state["status"] = "Investigating"
        state["last_active_agent"] = self.name
        
        # Log trace
        duration_ms = int((time.time() - start_time) * 1000)
        trace_entry = {
            "agent": "coordinator",
            "agent_name": self.name,
            "status": "completed",
            "action_taken": "Plan Generation",
            "log_details": f"Generated investigation plan with {len(plan['tasks'])} tasks. Priority: {plan['priority']}.",
            "duration_ms": duration_ms,
            "confidence": 1.0
        }
        
        logs = list(state.get("agent_logs") or [])
        logs.append(trace_entry)
        state["agent_logs"] = logs
        
        traces = list(state.get("agent_trace") or [])
        traces.append(trace_entry)
        state["agent_trace"] = traces
        
        return state
