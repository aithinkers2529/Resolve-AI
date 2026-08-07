import logging
import time
import uuid
from typing import Dict, Any
from apps.ai_engine.tools.registry import ToolRegistry

logger = logging.getLogger("escalation_agent")

class EscalationAgent:
    """Human Escalation Agent: Detects high-risk or policy-conflicted dispute claims and routes them to the human review queue."""

    def __init__(self):
        self.name = "EscalationAgent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        complaint_id = state.get("complaint_id") or state.get("case_id") or "UNKNOWN"
        fraud_res = state.get("fraud_result") or {}
        evidence_res = state.get("evidence_result") or {}
        claim_amount = state.get("claim_amount", 0.0)

        fraud_score = float(fraud_res.get("risk_score", 0.08))
        confidence = float(evidence_res.get("confidence", 0.90))

        if fraud_score >= 0.60:
            reason = "HIGH_FRAUD_RISK"
            detail = f"Multi-signal fraud score ({int(fraud_score * 100)}%) exceeds autonomous execution threshold."
        elif claim_amount >= 50000.0:
            reason = "HIGH_VALUE_TRANSACTION"
            detail = f"Claim transaction amount (INR {claim_amount:,.2f} >= INR 50,000) mandates manager verification under Policy HIGHVALUE-1.2."
        elif confidence < 0.80:
            reason = "WEAK_EVIDENCE"
            detail = f"Evidence confidence ({int(confidence * 100)}%) is below autonomous approval threshold."
        else:
            reason = "POLICY_CONFLICT"
            detail = "Policy conflict detected requiring manual human sign-off."

        esc_id = f"ESC-{uuid.uuid4().hex[:6].upper()}"
        escalation_record = {
            "escalation_id": esc_id,
            "case_id": complaint_id,
            "reason": reason,
            "risk_score": fraud_score,
            "confidence": confidence,
            "status": "PENDING_REVIEW",
            "detail": detail
        }

        state["escalation_record"] = escalation_record
        state["escalation_id"] = esc_id
        state["status"] = "Requires_Review"
        state["human_approval_required"] = True
        state["human_review_reason"] = detail
        state["last_active_agent"] = self.name

        duration_ms = int((time.time() - start_time) * 1000)
        trace_entry = {
            "agent": "escalation",
            "agent_name": self.name,
            "status": "completed",
            "action_taken": "Human Escalation Queue Placement",
            "log_details": f"Escalated case {complaint_id} to Admin Queue. Reason: {reason} ({detail}).",
            "duration_ms": duration_ms,
            "confidence": confidence
        }

        state.setdefault("agent_logs", []).append(trace_entry)
        state.setdefault("agent_trace", []).append(trace_entry)

        return state
