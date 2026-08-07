import logging
import time
from typing import Dict, Any
from apps.backend.app.services.mock_inventory import MockInventoryAPI
from apps.ai_engine.agents.resolution.scoring import ResolutionScoringEngine
from apps.ai_engine.decision.decision_gate import DecisionGateEngine
from apps.ai_engine.decision.decision_passport import DecisionPassportGenerator

logger = logging.getLogger("resolution_agent")

class ResolutionStrategyAgent:
    """Resolution Strategy Agent: Generates candidate options, evaluates multi-factor scores, and applies decision gate safety constraints."""

    def __init__(self):
        self.name = "Resolution Strategy Agent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        complaint_id = state.get("complaint_id", "UNKNOWN")
        claim_amount = state.get("claim_amount", 0.0)
        customer_requested = state.get("requested_resolution", "Replacement")
        product_sku = state.get("product_id", "SKU-LAPTOP-PRO-15")

        policy_res = state.get("policy_result") or {}
        evidence_res = state.get("evidence_result") or {}
        fraud_res = state.get("fraud_result") or {}

        logger.info(f"[{self.name}] Running multi-candidate resolution engine for dispute: {complaint_id}")

        # 1. Mock Enterprise Inventory Stock Lookup
        inventory_info = MockInventoryAPI.check_stock(product_sku)

        # 2. Multi-Candidate Resolution Scoring
        candidates = ResolutionScoringEngine.score_candidates(
            policy_res, evidence_res, fraud_res, inventory_info, customer_requested, claim_amount
        )

        selected_candidate = candidates[0] if candidates else None
        
        # 3. Deterministic Safety Decision Gate
        decision_status, human_review_req, human_review_reason = DecisionGateEngine.evaluate(
            selected_candidate.type,
            selected_candidate.score,
            policy_res,
            evidence_res,
            fraud_res,
            claim_amount
        )

        # 4. Generate Decision Passport
        passport = DecisionPassportGenerator.generate_passport(
            state, candidates, selected_candidate, decision_status, human_review_req, human_review_reason
        )

        state["resolution_candidates"] = [c.dict() for c in candidates]
        state["recommended_resolution"] = selected_candidate.type.value
        state["resolution_action"] = selected_candidate.name
        state["resolution_confidence"] = selected_candidate.score
        state["confidence"] = round(selected_candidate.score / 100.0, 2)
        state["decision_status"] = decision_status.value
        state["human_approval_required"] = human_review_req
        state["human_review_reason"] = human_review_reason
        state["resolution_reason"] = f"{selected_candidate.reasoning} Selected resolution score: {selected_candidate.score}%."
        state["decision_passport"] = passport
        state["last_active_agent"] = self.name

        duration_ms = int((time.time() - start_time) * 1000)
        trace_entry = {
            "agent": "resolution",
            "agent_name": self.name,
            "status": "completed",
            "action_taken": "Multi-Candidate Resolution Scoring",
            "log_details": f"Recommended Action: {selected_candidate.name} ({selected_candidate.score}% Score). Decision Gate Status: {decision_status.value}.",
            "duration_ms": duration_ms,
            "confidence": round(selected_candidate.score / 100.0, 2)
        }

        state.setdefault("agent_logs", []).append(trace_entry)
        state.setdefault("agent_trace", []).append(trace_entry)

        return state

# Alias for backwards compatibility with graph definition
ResolutionAgent = ResolutionStrategyAgent
