import logging
from typing import Dict, Any, List
from apps.ai_engine.agents.resolution.schemas import ResolutionType, CandidateOption
from apps.ai_engine.agents.resolution.rules import ResolutionRulesEngine

logger = logging.getLogger("resolution_scoring")

class ResolutionScoringEngine:
    """Resolution Decision Scoring Engine: Evaluates candidate options using a weighted multi-factor scoring matrix."""

    @staticmethod
    def score_candidates(
        policy_result: Dict[str, Any],
        evidence_result: Dict[str, Any],
        fraud_result: Dict[str, Any],
        inventory_info: Dict[str, Any],
        customer_requested: str,
        claim_amount: float
    ) -> List[CandidateOption]:
        
        candidates = [
            ResolutionType.REPLACEMENT,
            ResolutionType.REFUND,
            ResolutionType.PARTIAL_REFUND,
            ResolutionType.COUPON,
            ResolutionType.ESCALATION,
            ResolutionType.REJECT
        ]

        evidence_confidence = float(evidence_result.get("confidence", 0.90))
        fraud_score = float(fraud_result.get("risk_score", 0.08))
        req_lower = str(customer_requested).lower()

        results = []

        for cand in candidates:
            rule_check = ResolutionRulesEngine.validate_candidate(
                cand, policy_result, inventory_info, claim_amount, evidence_confidence
            )

            if not rule_check["eligible"]:
                results.append(CandidateOption(
                    type=cand,
                    name=cand.value.replace("_", " ").title(),
                    score=0.0,
                    eligible=False,
                    reasoning=rule_check["reason"]
                ))
                continue

            # Multi-Factor Weighted Scoring
            # 1. Policy Compliance (30%)
            policy_score = 30.0 if policy_result.get("eligible") == "Eligible" else 15.0

            # 2. Evidence Confidence (20%)
            evidence_score = evidence_confidence * 20.0

            # 3. Customer Fit & Preference (25%)
            if cand.value in req_lower or (cand == ResolutionType.REPLACEMENT and "replacement" in req_lower) or (cand == ResolutionType.REFUND and "refund" in req_lower):
                customer_fit_score = 25.0
            elif cand in [ResolutionType.REFUND, ResolutionType.REPLACEMENT]:
                customer_fit_score = 20.0
            elif cand == ResolutionType.PARTIAL_REFUND:
                customer_fit_score = 15.0
            else:
                customer_fit_score = 10.0

            # 4. Operational Feasibility (15%)
            if cand == ResolutionType.REPLACEMENT:
                feasibility_score = 15.0 if inventory_info.get("available") else 0.0
            else:
                feasibility_score = 15.0

            # 5. Cost Efficiency (10%)
            if cand == ResolutionType.REPLACEMENT:
                cost_score = 9.0
            elif cand == ResolutionType.PARTIAL_REFUND:
                cost_score = 10.0
            elif cand == ResolutionType.REFUND:
                cost_score = 8.0
            else:
                cost_score = 7.0

            raw_score = policy_score + evidence_score + customer_fit_score + feasibility_score + cost_score

            # Fraud Safety Penalty
            if fraud_score >= 0.60:
                if cand == ResolutionType.ESCALATION:
                    raw_score += 40.0  # Boost escalation for high fraud risk!
                else:
                    raw_score -= (fraud_score * 40.0)

            final_score = round(max(0.0, min(raw_score, 100.0)), 1)

            results.append(CandidateOption(
                type=cand,
                name=cand.value.replace("_", " ").title(),
                score=final_score,
                eligible=True,
                reasoning=rule_check["reason"]
            ))

        # Sort candidates descending by score
        results.sort(key=lambda x: x.score, reverse=True)
        return results
