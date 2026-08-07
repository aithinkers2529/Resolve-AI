import os
import logging
from typing import Dict, Any, Tuple
from apps.ai_engine.agents.resolution.schemas import DecisionStatus, ResolutionType

logger = logging.getLogger("decision_gate")

# Centralized Governance Thresholds with Environment Variable Override Support
FRAUD_ESCALATION_THRESHOLD = float(os.getenv("RESOLVE_FRAUD_ESCALATION_THRESHOLD", 0.60))
EVIDENCE_MIN_CONFIDENCE = float(os.getenv("RESOLVE_EVIDENCE_MIN_CONFIDENCE", 0.80))
DECISION_AUTO_APPROVAL_THRESHOLD = float(os.getenv("RESOLVE_DECISION_AUTO_APPROVAL_THRESHOLD", 0.80))
HIGH_VALUE_ORDER_THRESHOLD = float(os.getenv("RESOLVE_HIGH_VALUE_ORDER_THRESHOLD", 50000.0))

class DecisionGateEngine:
    """Deterministic Decision Gate: Evaluates safety constraints to route between AUTO_APPROVED, HUMAN_REVIEW, and REJECTED."""

    @staticmethod
    def evaluate(
        selected_resolution: ResolutionType,
        top_score: float,
        policy_result: Dict[str, Any],
        evidence_result: Dict[str, Any],
        fraud_result: Dict[str, Any],
        claim_amount: float
    ) -> Tuple[DecisionStatus, bool, str]:
        
        fraud_score = float(fraud_result.get("risk_score", 0.08))
        evidence_confidence = float(evidence_result.get("confidence", 0.90))
        policy_eligible = str(policy_result.get("eligible", "Eligible")).lower()
        conflicts = policy_result.get("conflicts", [])
        manual_review_required = policy_result.get("manual_review_required", False)

        # Gate Rule 1: Policy Ineligible -> REJECTED
        if "ineligible" in policy_eligible or "denied" in policy_eligible or selected_resolution == ResolutionType.REJECT:
            return (
                DecisionStatus.REJECTED,
                False,
                policy_result.get("reason", "Claim is ineligible under company policy rules.")
            )

        # Gate Rule 2: High Fraud Risk -> HUMAN_REVIEW
        if fraud_score >= FRAUD_ESCALATION_THRESHOLD:
            return (
                DecisionStatus.HUMAN_REVIEW,
                True,
                f"Multi-signal fraud score ({int(fraud_score * 100)}%) exceeds autonomous threshold ({int(FRAUD_ESCALATION_THRESHOLD * 100)}%)."
            )

        # Gate Rule 3: Weak Evidence Confidence -> HUMAN_REVIEW
        if evidence_confidence < EVIDENCE_MIN_CONFIDENCE:
            return (
                DecisionStatus.HUMAN_REVIEW,
                True,
                f"Evidence confidence ({int(evidence_confidence * 100)}%) is below autonomous threshold ({int(EVIDENCE_MIN_CONFIDENCE * 100)}%)."
            )

        # Gate Rule 4: High Value Transaction -> HUMAN_REVIEW
        if claim_amount >= HIGH_VALUE_ORDER_THRESHOLD or manual_review_required or len(conflicts) > 0:
            return (
                DecisionStatus.HUMAN_REVIEW,
                True,
                f"Claim amount (INR {claim_amount:,.2f} >= INR {HIGH_VALUE_ORDER_THRESHOLD:,.2f}) or policy conflict mandates manager verification."
            )

        # Gate Rule 5: Low Decision Confidence -> HUMAN_REVIEW
        if (top_score / 100.0) < DECISION_AUTO_APPROVAL_THRESHOLD or selected_resolution == ResolutionType.ESCALATION:
            return (
                DecisionStatus.HUMAN_REVIEW,
                True,
                f"Decision confidence ({int(top_score)}%) is below threshold ({int(DECISION_AUTO_APPROVAL_THRESHOLD * 100)}%)."
            )

        # All Safety Gates Passed -> AUTO_APPROVED
        return (
            DecisionStatus.AUTO_APPROVED,
            False,
            "All autonomous safety gates passed cleanly. Resolution authorized for automated execution."
        )
