import logging
from typing import Dict, Any, List
from apps.ai_engine.agents.resolution.schemas import ResolutionType

logger = logging.getLogger("resolution_rules")

class ResolutionRulesEngine:
    """Deterministic Business Rules Engine: Validates candidate resolution options against inventory, policy, and return window bounds."""

    @staticmethod
    def validate_candidate(
        candidate: ResolutionType,
        policy_result: Dict[str, Any],
        inventory_info: Dict[str, Any],
        claim_amount: float,
        evidence_confidence: float
    ) -> Dict[str, Any]:
        
        eligible_actions = policy_result.get("allowed_actions", ["Replacement", "Refund"])
        eligible_actions_upper = [a.upper() for a in eligible_actions]
        policy_eligible_str = str(policy_result.get("eligible", "Eligible")).lower()
        stock_available = inventory_info.get("available", True)
        
        if "ineligible" in policy_eligible_str or "denied" in policy_eligible_str:
            if candidate == ResolutionType.REJECT:
                return {"eligible": True, "reason": "Policy explicitly establishes claim ineligibility."}
            else:
                return {"eligible": False, "reason": "Claim is ineligible under company policy."}

        if candidate == ResolutionType.REPLACEMENT:
            if not stock_available:
                return {"eligible": False, "reason": f"Replacement item is out of stock in warehouse ({inventory_info.get('message')})."}
            if "REPLACEMENT" not in eligible_actions_upper and "EXCHANGE" not in eligible_actions_upper:
                return {"eligible": False, "reason": "Policy does not authorize product replacement."}
            return {"eligible": True, "reason": "Replacement authorized by policy and inventory in stock."}

        elif candidate == ResolutionType.REFUND:
            if "REFUND" not in eligible_actions_upper and "REPLACEMENT" not in eligible_actions_upper:
                return {"eligible": False, "reason": "Policy does not authorize cash refund."}
            return {"eligible": True, "reason": "Full refund authorized under policy guidelines."}

        elif candidate == ResolutionType.PARTIAL_REFUND:
            if "REFUND" not in eligible_actions_upper and "PARTIAL_REFUND" not in eligible_actions_upper:
                return {"eligible": False, "reason": "Partial refund not supported for this claim category."}
            return {"eligible": True, "reason": "Partial refund authorized as alternative resolution."}

        elif candidate == ResolutionType.COUPON:
            return {"eligible": True, "reason": "Store credit / promotional coupon authorized as goodwill gesture."}

        elif candidate == ResolutionType.ESCALATION:
            return {"eligible": True, "reason": "Escalation to human review is always permissible."}

        elif candidate == ResolutionType.REJECT:
            if "ineligible" in policy_eligible_str:
                return {"eligible": True, "reason": "Policy establishes claim rejection."}
            return {"eligible": False, "reason": "Cannot reject a valid, policy-eligible claim with consistent evidence."}

        return {"eligible": False, "reason": "Unknown resolution type."}
