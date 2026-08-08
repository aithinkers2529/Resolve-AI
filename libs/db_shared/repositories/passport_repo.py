from sqlalchemy.orm import Session
from libs.db_shared.models.passport import DecisionPassportModel
from typing import Optional, Dict, Any, List

class DecisionPassportRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_or_update(
        self,
        dispute_id: str,
        decision: str,
        confidence_score: float,
        fraud_risk_score: float,
        verified_evidence: Dict[str, Any],
        policy_matched: str,
        policy_clause: str,
        customer_context: Dict[str, Any],
        alternatives_evaluated: List[Dict[str, Any]],
        final_reasoning: str,
        execution_proof: Dict[str, Any]
    ) -> DecisionPassportModel:
        existing = self.db.query(DecisionPassportModel).filter(
            DecisionPassportModel.dispute_id == dispute_id
        ).first()

        if existing:
            existing.decision = decision
            existing.confidence_score = confidence_score
            existing.fraud_risk_score = fraud_risk_score
            existing.verified_evidence = verified_evidence
            existing.policy_matched = policy_matched
            existing.policy_clause = policy_clause
            existing.customer_context = customer_context
            existing.alternatives_evaluated = alternatives_evaluated
            existing.final_reasoning = final_reasoning
            existing.execution_proof = execution_proof
            self.db.commit()
            self.db.refresh(existing)
            return existing

        passport = DecisionPassportModel(
            dispute_id=dispute_id,
            decision=decision,
            confidence_score=confidence_score,
            fraud_risk_score=fraud_risk_score,
            verified_evidence=verified_evidence,
            policy_matched=policy_matched,
            policy_clause=policy_clause,
            customer_context=customer_context,
            alternatives_evaluated=alternatives_evaluated,
            final_reasoning=final_reasoning,
            execution_proof=execution_proof
        )
        self.db.add(passport)
        self.db.commit()
        self.db.refresh(passport)
        return passport

    def get_by_dispute_id(self, dispute_id: str) -> Optional[DecisionPassportModel]:
        return self.db.query(DecisionPassportModel).filter(
            DecisionPassportModel.dispute_id == dispute_id
        ).first()
