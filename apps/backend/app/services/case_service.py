from sqlalchemy.orm import Session
from libs.db_shared.repositories.dispute_repo import DisputeRepository
from app.core.exceptions import CaseNotFoundException
from libs.db_shared.models.dispute import Dispute
from typing import List, Optional, Dict, Any
import sys
import os

# Include AI engine path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai_engine")))
try:
    from graph.definition import app_graph
except ImportError:
    app_graph = None

class CaseService:
    def __init__(self, db: Session):
        self.repo = DisputeRepository(db)

    def get_case(self, case_id: str) -> Dispute:
        case = self.repo.get_by_id(case_id)
        if not case:
            raise CaseNotFoundException(case_id)
        return case

    def list_cases(self, skip: int = 0, limit: int = 50) -> List[Dispute]:
        return self.repo.get_all(skip, limit)

    async def create_case(self, case_data: dict) -> Dispute:
        # Save to database first
        case = self.repo.create(case_data)
        
        # Trigger the LangGraph multi-agent orchestration pipeline
        if app_graph:
            initial_state = {
                "complaint_id": case.id,
                "customer_name": case.customer_name,
                "customer_email": case.customer_email,
                "customer_history_count": int(getattr(case, "customer_history_count", 0) or 0),
                "complaint_text": case.complaint_text,
                "category": getattr(case, "category", "Damaged Product"),
                "claim_amount": case.claim_amount,
                "evidence_urls": case.evidence_urls or [],
                "status": "New",
                "agent_logs": []
            }
            
            final_state = await app_graph.ainvoke(initial_state)
            
            # Persist outcomes from agent execution back to DB
            updates = {
                "status": final_state.get("status", "Analyzing"),
                "fraud_score": final_state.get("fraud_score", 0.0),
                "fraud_risk_level": final_state.get("fraud_risk_level", "Low"),
                "fraud_reasons": final_state.get("fraud_reasons", []),
                "policy_eligible": final_state.get("policy_eligible", "Eligible"),
                "policy_reference": final_state.get("policy_reference", ""),
                "policy_notes": final_state.get("policy_notes", ""),
                "resolution_action": final_state.get("resolution_action", "Pending"),
                "resolution_reason": final_state.get("resolution_reason", ""),
                "confidence": final_state.get("confidence", 0.90),
                "ocr_text": final_state.get("ocr_text", "")
            }
            
            case = self.repo.update(case.id, updates)
            
            # Save runs/logs to agent_logs database table
            for log in final_state.get("agent_logs", []):
                self.repo.add_agent_log({
                    "dispute_id": case.id,
                    "agent_name": log.get("agent_name"),
                    "action_taken": log.get("action_taken"),
                    "log_details": log.get("log_details")
                })
        
        self.repo.log_audit({
            "operator": "API_GATEWAY",
            "action": "CASE_CREATED",
            "details": f"Dispute case {case.id} created for customer {case.customer_name}"
        })
        
        return case

    def update_case_status(self, case_id: str, updates: dict) -> Dispute:
        case = self.repo.update(case_id, updates)
        if not case:
            raise CaseNotFoundException(case_id)
        return case
