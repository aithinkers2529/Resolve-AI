import logging

logger = logging.getLogger("fraud_agent")

class FraudAgent:
    def __init__(self):
        self.name = "Fraud Detection Agent"

    async def execute(self, state: dict) -> dict:
        logger.info(f"[{self.name}] Running fraud heuristics for dispute: {state.get('complaint_id')}")
        
        history_count = state.get("customer_history_count", 0)
        claim_amount = state.get("claim_amount", 0.0)
        email = state.get("customer_email", "")
        text = state.get("complaint_text", "").lower()
        
        fraud_score = 0.08 # Default clean baseline
        reasons = []
        
        # Rule 1: High claim frequency
        if history_count >= 3:
            fraud_score += 0.50
            reasons.append(f"{history_count} previous claims filed within last 30 days.")
            
        # Rule 2: High claim amount without physical evidence
        if claim_amount > 1000.0 and not state.get("evidence_summary", {}).get("damage_detected"):
            fraud_score += 0.25
            reasons.append(f"High value claim (${claim_amount}) lacks physical damage verification.")
            
        # Rule 3: Known suspicious account flag
        if "fraud" in email or "never arrived" in text and history_count > 1:
            fraud_score += 0.20
            reasons.append("Geolocation & Carrier signature mismatch recorded.")
            
        if not reasons:
            reasons.append("Account clean. Transaction history verified.")
            
        fraud_score = min(round(fraud_score, 2), 0.99)
        risk_level = "High" if fraud_score > 0.60 else ("Medium" if fraud_score > 0.30 else "Low")
        
        state["fraud_score"] = fraud_score
        state["fraud_risk_level"] = risk_level
        state["fraud_reasons"] = reasons
        state["last_active_agent"] = self.name
        
        log_entry = {
            "agent_name": self.name,
            "action_taken": "Hybrid Fraud Analysis",
            "log_details": f"Fraud Score: {fraud_score} ({risk_level} Risk). Risk Factors: {'; '.join(reasons)}"
        }
        state.setdefault("agent_logs", []).append(log_entry)
        
        return state
