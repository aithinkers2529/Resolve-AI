import logging

logger = logging.getLogger("escalation_agent")

class EscalationAgent:
    def __init__(self):
        self.name = "Human Approval Agent"

    async def execute(self, state: dict) -> dict:
        logger.info(f"[{self.name}] Halting execution for human review on dispute: {state.get('complaint_id')}")
        
        state["status"] = "Requires_Review"
        state["human_approval_required"] = True
        state["last_active_agent"] = self.name
        
        log_entry = {
            "agent_name": self.name,
            "action_taken": "Human Approval Interruption",
            "log_details": f"Claim halted due to High Fraud Risk ({int(state.get('fraud_score', 0)*100)}%) or Policy Audit constraint. Exposed to Admin Approval Queue."
        }
        state.setdefault("agent_logs", []).append(log_entry)
        
        return state
