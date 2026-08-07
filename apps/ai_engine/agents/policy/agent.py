import logging
import time
from typing import Dict, Any, List
from apps.ai_engine.knowledge.policy_kb import PolicyKnowledgeBase

logger = logging.getLogger("policy_agent")

class PolicyAgent:
    """Policy Intelligence Agent: Performs policy RAG retrieval, section citations, and policy conflict detection."""

    def __init__(self):
        self.name = "Policy Intelligence Agent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        complaint_id = state.get("complaint_id", "UNKNOWN")
        category = state.get("category", "")
        text = state.get("complaint_text", "").lower()
        history_count = state.get("customer_history_count", 0)
        claim_amount = state.get("claim_amount", 0.0)

        logger.info(f"[{self.name}] Querying policy knowledge base for dispute: {complaint_id}")

        # Retrieve relevant policies
        matched_policies = PolicyKnowledgeBase.search_policies(category, claim_amount)
        primary_policy = matched_policies[0]

        citations = []
        conflicts = []
        manual_review_required = False

        for p in matched_policies:
            citations.append({
                "policy_id": p["policy_id"],
                "section": p["section"],
                "policy_name": p["policy_name"],
                "relevance": 0.95 if p["policy_id"] == primary_policy["policy_id"] else 0.88
            })

        # Conflict Detection Heuristics
        if history_count >= 3:
            policy_id = "FRAUD-3.0"
            eligible = "Ineligible - Audit Required"
            conflicts.append("High claim frequency policy (FRAUD-3.0) overrides standard refund coverage.")
            manual_review_required = True
        elif claim_amount >= 50000.0:
            policy_id = primary_policy["policy_id"]
            eligible = "Eligible"
            conflicts.append(f"High-value transaction amount (INR {claim_amount:,.2f} >= 50,000) mandates manual verification under Policy HIGHVALUE-1.2.")
            manual_review_required = True
        else:
            policy_id = primary_policy["policy_id"]
            eligible = "Eligible"

        reason = primary_policy["rules"][0]
        if conflicts:
            reason += " | " + " ".join(conflicts)

        policy_result = {
            "eligible": eligible,
            "policy_id": policy_id,
            "policy_name": primary_policy["policy_name"],
            "policy_reference": primary_policy["section"],
            "policy_references": citations,
            "allowed_actions": primary_policy.get("allowed_actions", ["Replacement", "Refund"]),
            "conflicts": conflicts,
            "manual_review_required": manual_review_required,
            "maximum_refund": claim_amount,
            "reason": reason
        }

        state["policy_result"] = policy_result
        state["policy_eligible"] = eligible
        state["policy_reference"] = primary_policy["section"]
        state["policy_notes"] = f"Policy {policy_id} ({primary_policy['section']}): {reason}"
        if manual_review_required:
            state["human_approval_required"] = True
        state["last_active_agent"] = self.name

        duration_ms = int((time.time() - start_time) * 1000)
        trace_entry = {
            "agent": "policy",
            "agent_name": self.name,
            "status": "completed",
            "action_taken": "Policy RAG & Citation Retrieval",
            "log_details": f"Cited Policy {policy_id} ({primary_policy['section']}). Conflicts detected: {len(conflicts)}.",
            "duration_ms": duration_ms,
            "confidence": 0.95
        }

        state.setdefault("agent_logs", []).append(trace_entry)
        state.setdefault("agent_trace", []).append(trace_entry)

        return state
