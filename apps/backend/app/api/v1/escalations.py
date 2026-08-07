"""
Human Escalation & Approval Workflow API Router.

Endpoints:
  GET  /escalations           - List pending human review cases
  POST /escalations/{id}/approve      - Human manager approves & triggers execution
  POST /escalations/{id}/reject       - Human manager rejects the claim
  POST /escalations/{id}/request-info - Request more information from customer
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from libs.db_shared.models.audit import AuditLog
from app.services.case_service import CaseService
from app.schemas.case import CaseResponse
from app.api.deps import get_current_user, require_permission
from app.core.permissions import RESOLUTION_APPROVE
from app.services.audit import AuditTrailService, HUMAN_APPROVED, HUMAN_REJECTED, INFO_REQUESTED, HUMAN_REVIEW_REQUESTED
from apps.ai_engine.agents.workflow.agent import WorkflowExecutionAgent
from apps.backend.app.services.mock_enterprise import MockNotificationAPI
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

router = APIRouter()


class EscalationActionRequest(BaseModel):
    notes: Optional[str] = None


# --- In-memory escalation queue ---
_ESCALATION_QUEUE: List[Dict[str, Any]] = []


def _get_or_create_escalation(case_id: str, reason: str = "PENDING_REVIEW") -> Dict[str, Any]:
    for esc in _ESCALATION_QUEUE:
        if esc["case_id"] == case_id:
            return esc
    new_esc = {
        "escalation_id": f"ESC-{case_id}",
        "case_id": case_id,
        "reason": reason,
        "status": "PENDING_REVIEW"
    }
    _ESCALATION_QUEUE.append(new_esc)
    return new_esc


@router.get("/", response_model=List[Dict[str, Any]])
def list_escalations(
    current_user: User = Depends(require_permission(RESOLUTION_APPROVE)),
    db: Session = Depends(get_db)
):
    """List all cases currently pending human manager review."""
    service = CaseService(db)
    all_cases = service.list_cases(skip=0, limit=1000)
    pending = [c for c in all_cases if c.status == "Requires_Review" or c.human_approval_required]
    return [
        {
            "escalation_id": f"ESC-{c.id}",
            "case_id": c.id,
            "customer_name": c.customer_name,
            "customer_email": c.customer_email,
            "order_id": c.order_id,
            "claim_amount": c.claim_amount,
            "fraud_score": c.fraud_score,
            "fraud_risk_level": c.fraud_risk_level,
            "resolution_action": c.resolution_action,
            "confidence": c.confidence,
            "policy_reference": c.policy_reference,
            "status": "PENDING_REVIEW",
            "escalation_reason": "HIGH_VALUE_TRANSACTION" if c.claim_amount >= 50000.0 else (
                "HIGH_FRAUD_RISK" if c.fraud_score >= 0.60 else "POLICY_CONFLICT"
            ),
            "detail": (
                f"Claim amount INR {c.claim_amount:,.2f} exceeds INR 50,000 high-value threshold." if c.claim_amount >= 50000.0
                else f"Fraud risk score {int(c.fraud_score * 100)}% exceeds autonomous execution threshold."
                if c.fraud_score >= 0.60 else "Policy conflict detected."
            )
        }
        for c in pending
    ]


@router.post("/{case_id}/approve", response_model=Dict[str, Any])
async def approve_escalation(
    case_id: str,
    payload: EscalationActionRequest = EscalationActionRequest(),
    current_user: User = Depends(require_permission(RESOLUTION_APPROVE)),
    db: Session = Depends(get_db)
):
    """Human manager approves escalated case. Triggers Workflow Execution Agent automatically."""
    service = CaseService(db)
    case = service.get_case(case_id)

    if case.status not in ("Requires_Review", "New", "Analyzing"):
        if case.status in ("Approved", "Resolved"):
            return {"case_id": case_id, "status": case.status, "message": "Case already resolved."}

    # Execute workflow
    exec_state = {
        "complaint_id": case.id,
        "case_id": case.id,
        "order_id": case.order_id or "ORD-UNKNOWN",
        "customer_email": case.customer_email,
        "claim_amount": case.claim_amount,
        "resolution_action": case.resolution_action or "Replacement",
        "recommended_resolution": case.resolution_action or "replacement",
        "agent_logs": [],
        "agent_trace": []
    }

    agent = WorkflowExecutionAgent()
    final_state = await agent.execute(exec_state)

    service.update_case_status(case_id, {
        "status": "Approved",
        "human_approval_required": False
    })

    # Persist audit
    audit = AuditLog(
        operator=current_user.email,
        action="HUMAN_APPROVAL_GRANTED",
        details=f"Human manager '{current_user.email}' approved dispute {case_id}. Resolution: {case.resolution_action}. Notes: {payload.notes or 'None'}"
    )
    db.add(audit)
    db.commit()

    AuditTrailService.record(
        case_id=case_id, event_type=HUMAN_APPROVED, agent="EscalationAgent",
        actor=current_user.email, details=f"Human approval granted by {current_user.email}.",
        metadata={"resolution": case.resolution_action, "notes": payload.notes}
    )

    execution_plan = final_state.get("execution_plan", {})
    executed_actions = final_state.get("executed_actions", [])

    return {
        "case_id": case_id,
        "status": "Approved",
        "approved_by": current_user.email,
        "resolution": case.resolution_action,
        "execution_plan": execution_plan,
        "executed_actions": executed_actions,
        "message": f"Case {case_id} approved and enterprise workflow executed successfully."
    }


@router.post("/{case_id}/reject", response_model=Dict[str, Any])
def reject_escalation(
    case_id: str,
    payload: EscalationActionRequest = EscalationActionRequest(),
    current_user: User = Depends(require_permission(RESOLUTION_APPROVE)),
    db: Session = Depends(get_db)
):
    """Human manager rejects escalated claim and sends customer notification."""
    service = CaseService(db)
    case = service.get_case(case_id)

    service.update_case_status(case_id, {
        "status": "Rejected",
        "human_approval_required": False
    })

    # Notify customer
    MockNotificationAPI.send_customer_notice(
        email=case.customer_email or "customer@example.com",
        subject="Dispute Claim Decision",
        message=f"We have reviewed your dispute claim for Order {case.order_id}. After thorough analysis, we are unable to process your claim at this time. Reason: {payload.notes or 'Insufficient supporting evidence.'}. Reference: {case_id}."
    )

    audit = AuditLog(
        operator=current_user.email,
        action="HUMAN_REJECTION",
        details=f"Dispute {case_id} rejected by '{current_user.email}'. Notes: {payload.notes or 'None'}"
    )
    db.add(audit)
    db.commit()

    AuditTrailService.record(
        case_id=case_id, event_type=HUMAN_REJECTED, agent="EscalationAgent",
        actor=current_user.email, details=f"Claim rejected by {current_user.email}. Notes: {payload.notes or 'None'}",
        metadata={"notes": payload.notes}
    )

    return {
        "case_id": case_id,
        "status": "Rejected",
        "rejected_by": current_user.email,
        "message": f"Case {case_id} rejected. Customer notification sent to {case.customer_email}."
    }


@router.post("/{case_id}/request-info", response_model=Dict[str, Any])
def request_more_info(
    case_id: str,
    payload: EscalationActionRequest = EscalationActionRequest(),
    current_user: User = Depends(require_permission(RESOLUTION_APPROVE)),
    db: Session = Depends(get_db)
):
    """Request additional information or evidence from the customer before deciding."""
    service = CaseService(db)
    case = service.get_case(case_id)

    service.update_case_status(case_id, {
        "status": "Requires_Review",
        "human_approval_required": True
    })

    # Notify customer
    MockNotificationAPI.send_customer_notice(
        email=case.customer_email or "customer@example.com",
        subject="Additional Information Required",
        message=f"We need additional documentation to process your claim for Order {case.order_id}. Please provide: {payload.notes or 'Original purchase invoice and photos of the damaged product.'}. Reference: {case_id}."
    )

    audit = AuditLog(
        operator=current_user.email,
        action="CUSTOMER_INFO_REQUESTED",
        details=f"Manager '{current_user.email}' requested more information for dispute {case_id}. Required: {payload.notes or 'None'}"
    )
    db.add(audit)
    db.commit()

    AuditTrailService.record(
        case_id=case_id, event_type=INFO_REQUESTED, agent="EscalationAgent",
        actor=current_user.email, details=f"Additional information requested from customer. Required: {payload.notes}",
        metadata={"requested_by": current_user.email, "info_required": payload.notes}
    )

    return {
        "case_id": case_id,
        "status": "Requires_Review",
        "requested_by": current_user.email,
        "info_required": payload.notes or "Original purchase invoice and photos of the damaged product.",
        "message": f"Customer at {case.customer_email} has been notified to provide additional documentation."
    }
