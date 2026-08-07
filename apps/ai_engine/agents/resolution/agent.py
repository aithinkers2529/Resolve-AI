import logging

logger = logging.getLogger("resolution_agent")

class ResolutionAgent:
    def __init__(self):
        self.name = "Resolution Strategy Agent"

    async def execute(self, state: dict) -> dict:
        logger.info(f"[{self.name}] Synthesizing resolution strategy for dispute: {state.get('complaint_id')}")
        
        fraud_score = state.get("fraud_score", 0.0)
        policy_eligible = state.get("policy_eligible", "Eligible")
        category = state.get("category", "")
        evidence_summary = state.get("evidence_summary", {})
        
        action = "Escalate"
        reason = ""
        confidence = 0.90
        
        # High Fraud Risk -> Escalate for Human Review
        if fraud_score > 0.60 or "Audit Required" in policy_eligible:
            action = "Escalate"
            reason = f"Fraud Score ({int(fraud_score * 100)}%) exceeds safe threshold or triggers policy audit. Escalated to Human Approval Queue."
            confidence = 0.65
        elif "Damaged" in category:
            action = "Replacement"
            reason = "Evidence confirms physical damage. Claim eligible under Warranty Section 4.2. Low fraud risk. Replacement authorized."
            confidence = 0.95
        elif "Wrong Product" in category:
            action = "Refund"
            reason = "Warehouse scan log confirms SKU fulfillment error. Refund authorized under Exchange Policy Section 2.3."
            confidence = 0.98
        else:
            action = "Refund"
            reason = "Claim satisfies standard customer protection policies with clean fraud assessment."
            confidence = 0.92
            
        state["resolution_action"] = action
        state["resolution_reason"] = reason
        state["confidence"] = confidence
        state["last_active_agent"] = self.name
        
        log_entry = {
            "agent_name": self.name,
            "action_taken": "Strategy Decision Synthesis",
            "log_details": f"Decision: {action}. Confidence: {int(confidence * 100)}%. Rationale: {reason}"
        }
        state.setdefault("agent_logs", []).append(log_entry)
        
        return state
