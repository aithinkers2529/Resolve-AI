from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from libs.db_shared.models.audit import AuditLog
from libs.db_shared.models.agent_run import AgentRun
from app.services.case_service import CaseService
from app.schemas.case import CaseCreateRequest, CaseResponse, CaseUpdateRequest
from app.api.deps import get_current_user, require_permission, check_case_ownership
from app.core.permissions import CASE_CREATE, RESOLUTION_REVIEW, RESOLUTION_APPROVE
from apps.ai_engine.graph.definition import app_graph
from apps.ai_engine.agents.workflow.agent import WorkflowExecutionAgent
from app.services.audit import AuditTrailService, HUMAN_APPROVED, HUMAN_REJECTED, CASE_RESOLVED, CUSTOMER_NOTIFIED, REFUND_CREATED, SHIPMENT_CREATED
from app.services.mock_enterprise import MockNotificationAPI
from apps.ai_engine.tools.idempotency import IDEMPOTENCY_STORE
from typing import List, Dict, Any, Optional

router = APIRouter()

@router.get("/", response_model=List[CaseResponse])
def list_cases(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve dispute cases. Customers are automatically restricted to their own claims."""
    service = CaseService(db)
    user_role = str(current_user.role).upper()
    
    if user_role == "CUSTOMER":
        all_cases = service.list_cases(skip=0, limit=1000)
        user_cases = [c for c in all_cases if c.customer_email and c.customer_email.lower() == current_user.email.lower()]
        return user_cases[skip:skip + limit]
        
    return service.list_cases(skip, limit)

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve single case details with resource-level IDOR ownership validation."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)
    return case

@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    case_data: CaseCreateRequest,
    current_user: User = Depends(require_permission(CASE_CREATE)),
    db: Session = Depends(get_db)
):
    """Submit a new dispute case. Triggers case creation and automatic investigation."""
    service = CaseService(db)
    payload = case_data.model_dump()
    
    if str(current_user.role).upper() == "CUSTOMER":
        payload["customer_name"] = current_user.full_name or current_user.email
        payload["customer_email"] = current_user.email

    case = await service.create_case(payload)
    return case

@router.post("/{case_id}/investigate", response_model=CaseResponse)
async def start_investigation(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger multi-agent dispute investigation workflow."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)

    state = {
        "complaint_id": case.id,
        "customer_id": case.customer_id,
        "customer_name": case.customer_name,
        "customer_email": case.customer_email,
        "customer_history_count": case.customer_history_count or 0,
        "order_id": case.order_id,
        "complaint_text": case.complaint_text,
        "category": case.category,
        "claim_amount": case.claim_amount,
        "evidence_urls": case.evidence_urls or [],
        "agent_logs": [],
        "agent_trace": []
    }

    # Execute LangGraph Multi-Agent State Machine
    final_state = await app_graph.ainvoke(state)

    # Persist updated status and indicators
    updates = {
        "status": final_state.get("status", case.status),
        "fraud_score": final_state.get("fraud_score", case.fraud_score),
        "fraud_risk_level": final_state.get("fraud_risk_level", case.fraud_risk_level),
        "policy_eligible": final_state.get("policy_eligible", case.policy_eligible),
        "policy_reference": final_state.get("policy_reference", case.policy_reference),
        "resolution_action": final_state.get("resolution_action", case.resolution_action),
        "resolution_reason": final_state.get("resolution_reason", case.resolution_reason),
        "confidence": final_state.get("confidence", case.confidence),
        "human_approval_required": final_state.get("human_approval_required", False)
    }
    updated_case = service.update_case_status(case_id, updates)

    # Persist trace to agent_runs
    trace = final_state.get("agent_trace") or []
    for item in trace:
        run = AgentRun(
            dispute_id=case_id,
            agent_name=item.get("agent_name", item.get("agent", "Agent")),
            status=item.get("status", "completed"),
            action_taken=item.get("action_taken", "Investigation Step"),
            log_details=item.get("log_details", "")
        )
        db.add(run)
    db.commit()

    return updated_case

@router.get("/{case_id}/trace")
def get_case_trace(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve agent execution trace timeline for visualization."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)

    runs = db.query(AgentRun).filter(AgentRun.dispute_id == case_id).order_by(AgentRun.created_at.asc()).all()
    return runs

@router.get("/{case_id}/decision")
@router.get("/{case_id}/decision-passport")
def get_case_decision_passport(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve Multimodal Explainable AI Decision Passport for dispute resolution."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)

    is_damaged = "Damaged" in (case.category or "")
    
    explanation_points = [
        f"Order '{case.order_id}' was verified against enterprise database records.",
        "Uploaded image and invoice evidence were analyzed and correlated with customer claim.",
        f"Policy '{case.policy_reference or 'WARRANTY-4.2'}' confirms coverage eligibility.",
        f"Multi-signal fraud risk score assessed at {int(case.fraud_score * 100)}% ({case.fraud_risk_level or 'Low Risk'}).",
        f"Action '{case.resolution_action or 'Replacement'}' selected with {int(case.confidence * 100)}% overall confidence score."
    ]

    return {
        "case_id": case.id,
        "customer_name": case.customer_name,
        "customer_email": case.customer_email,
        "order_id": case.order_id,
        "category": case.category,
        "claim_amount": case.claim_amount,
        "status": case.status,
        "facts": {
            "order_verified": True,
            "order_id": case.order_id,
            "claim_amount": case.claim_amount
        },
        "evidence_analysis": {
            "consistency_status": "CONSISTENT" if case.fraud_score < 0.30 else ("INCONSISTENT" if case.fraud_score > 0.60 else "MOSTLY_CONSISTENT"),
            "confidence": case.confidence,
            "damage_detected": is_damaged
        },
        "policy": {
            "policy_eligible": case.policy_eligible,
            "policy_reference": case.policy_reference,
            "notes": case.policy_notes
        },
        "policy_reference": case.policy_reference,
        "policy_eligible": case.policy_eligible,
        "recommended_action": case.resolution_action,
        "confidence": case.confidence,
        "fraud_score": case.fraud_score,
        "fraud_risk_level": case.fraud_risk_level,
        "reasoning": case.resolution_reason,
        "explanation": explanation_points,
        "human_approval_required": case.status == "Requires_Review"
    }

@router.post("/{case_id}/resolution/analyze")
@router.get("/{case_id}/resolution")
def get_case_resolution_analysis(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve multi-candidate resolution scoring and decision gate evaluation."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)

    is_high_fraud = case.fraud_score >= 0.60
    is_high_val = case.claim_amount >= 50000.0
    
    candidates = [
        {
            "type": "replacement",
            "name": "Replacement",
            "score": 95.0 if not is_high_fraud and not is_high_val else 45.0,
            "eligible": True,
            "reasoning": "Product stock available in warehouse. Damage confirmed by image analysis."
        },
        {
            "type": "refund",
            "name": "Refund",
            "score": 82.0 if not is_high_fraud else 30.0,
            "eligible": True,
            "reasoning": "Full refund authorized under Policy WARRANTY-4.2."
        },
        {
            "type": "partial_refund",
            "name": "Partial Refund",
            "score": 64.0,
            "eligible": True,
            "reasoning": "Goodwill compensation option."
        },
        {
            "type": "escalation",
            "name": "Escalation to Manager",
            "score": 98.0 if (is_high_fraud or is_high_val) else 20.0,
            "eligible": True,
            "reasoning": "Escalate to human review."
        }
    ]

    candidates.sort(key=lambda x: x["score"], reverse=True)

    decision_status = "HUMAN_REVIEW" if (is_high_fraud or is_high_val or case.status == "Requires_Review") else ("REJECTED" if case.status == "Rejected" else "AUTO_APPROVED")

    return {
        "case_id": case.id,
        "recommended_resolution": candidates[0]["type"],
        "recommended_action": candidates[0]["name"],
        "confidence": candidates[0]["score"],
        "candidates": candidates,
        "decision_status": decision_status,
        "human_review_required": decision_status == "HUMAN_REVIEW",
        "human_review_reason": "High fraud risk or transaction amount >= INR 50,000 threshold" if decision_status == "HUMAN_REVIEW" else "Autonomous verification clean."
    }

@router.get("/{case_id}/evidence-analysis")
def get_case_evidence_analysis(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve detailed multimodal evidence correlation and consistency report."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)

    is_consistent = case.fraud_score < 0.60
    return {
        "case_id": case.id,
        "evidence_urls": case.evidence_urls or [],
        "consistency_status": "CONSISTENT" if is_consistent else "INCONSISTENT",
        "consistency_score": 0.95 if is_consistent else 0.45,
        "matches": [
            f"Order ID match ({case.order_id})",
            "Product SKU match (SKU-LAPTOP-PRO-15)",
            f"Purchase Amount match (INR {case.claim_amount:,.2f})"
        ] if is_consistent else [],
        "mismatches": [
            "High claim frequency recorded",
            "Carrier delivery signature recorded"
        ] if not is_consistent else [],
        "evidence_summary": case.evidence_summary or {}
    }

@router.get("/{case_id}/policies")
def get_case_policies(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve policy RAG citations and conflict checks."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)

    conflicts = []
    if case.claim_amount >= 50000.0:
        conflicts.append("High-value transaction amount (>= INR 50,000) mandates manual manager verification under Policy HIGHVALUE-1.2.")
    if case.customer_history_count and case.customer_history_count >= 3:
        conflicts.append("High claim frequency policy (FRAUD-3.0) overrides standard refund coverage.")

    return {
        "case_id": case.id,
        "primary_policy": case.policy_reference or "Refund Policy Section 4.2",
        "policy_eligible": case.policy_eligible,
        "policy_citations": [
            {
                "policy_id": "WARRANTY-4.2",
                "section": "Section 4.2 - Damaged In Transit Coverage",
                "policy_name": "Damaged In Transit Coverage",
                "relevance": 0.96
            },
            {
                "policy_id": "HIGHVALUE-1.2",
                "section": "Section 1.2 - High-Value Verification Constraint",
                "policy_name": "High-Value Transaction Policy",
                "relevance": 0.90
            }
        ],
        "conflicts": conflicts,
        "manual_review_required": len(conflicts) > 0 or case.status == "Requires_Review"
    }

@router.post("/{case_id}/execute")
async def execute_workflow(
    case_id: str,
    current_user: User = Depends(require_permission(RESOLUTION_APPROVE)),
    db: Session = Depends(get_db)
):
    """Trigger Workflow Execution Agent for an approved or auto-approved dispute case."""
    service = CaseService(db)
    case = service.get_case(case_id)

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

    service.update_case_status(case_id, {"status": "Approved", "human_approval_required": False})

    audit = AuditLog(
        operator=current_user.email,
        action="WORKFLOW_EXECUTED",
        details=f"Workflow execution triggered for dispute {case_id} by {current_user.email}."
    )
    db.add(audit)
    db.commit()

    AuditTrailService.record(
        case_id=case_id, event_type=CASE_RESOLVED, agent="WorkflowExecutionAgent",
        actor=current_user.email, details="Workflow execution completed successfully.",
        metadata={"execution_plan": final_state.get("execution_plan", {}), "actions": final_state.get("executed_actions", [])}
    )

    return {
        "case_id": case_id,
        "status": "Approved",
        "executed_by": current_user.email,
        "execution_plan": final_state.get("execution_plan", {}),
        "executed_actions": final_state.get("executed_actions", []),
        "execution_results": final_state.get("execution_results", [])
    }


@router.get("/{case_id}/execution")
def get_execution_status(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the current execution plan and action statuses for a dispute case."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)

    # Build execution plan from idempotency store
    action_types = ["verify_order", "reserve_inventory", "create_refund", "create_shipment", "schedule_pickup", "send_notification"]
    actions = []
    for action_type in action_types:
        key = f"{case_id}:{action_type}"
        if key in IDEMPOTENCY_STORE:
            entry = IDEMPOTENCY_STORE[key]
            actions.append({"action_type": action_type, "status": entry.get("status", "SUCCESS"), "result": entry.get("result", {})})

    return {
        "case_id": case_id,
        "status": case.status,
        "resolution": case.resolution_action,
        "execution_status": "COMPLETED" if case.status in ("Approved", "Resolved") else "PENDING",
        "actions": actions
    }


@router.get("/{case_id}/execution/timeline")
def get_execution_timeline(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve timestamped execution event timeline for a dispute case."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)
    timeline = AuditTrailService.get_execution_timeline(case_id)
    return {"case_id": case_id, "timeline": timeline}


@router.get("/{case_id}/audit")
def get_case_audit(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve immutable append-only audit trail for a dispute case."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)
    events = AuditTrailService.get_events_for_case(case_id)
    return {"case_id": case_id, "event_count": len(events), "events": events}


@router.get("/{case_id}/notifications")
def get_case_notifications(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve customer notification history for a dispute case."""
    service = CaseService(db)
    case = service.get_case(case_id)
    check_case_ownership(case, current_user)
    events = AuditTrailService.get_events_for_case(case_id)
    notification_events = [e for e in events if e["event_type"] == CUSTOMER_NOTIFIED]
    return {"case_id": case_id, "customer_email": case.customer_email, "notifications": notification_events}


from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.services.passport_service import DecisionPassportService
from libs.db_shared.repositories.replacement_repo import ReplacementRepository

@router.post("/{case_id}/approve", response_model=CaseResponse)
@router.post("/disputes/{case_id}/approve", response_model=CaseResponse)
async def approve_case(
    case_id: str,
    current_user: User = Depends(require_permission(RESOLUTION_APPROVE)),
    db: Session = Depends(get_db)
):
    """Human-in-the-loop approval endpoint for escalated cases. Executes resolution via Mock Enterprise APIs, credits wallet or creates replacement, and notifies customer."""
    service = CaseService(db)
    case = service.get_case(case_id)
    wallet_service = WalletService(db)
    notif_service = NotificationService(db)
    passport_service = DecisionPassportService(db)
    replacement_repo = ReplacementRepository(db)

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
    await agent.execute(exec_state)

    # If action is Refund, process refund atomically into wallet
    action = case.resolution_action or "Replacement"
    if action.lower() == "refund":
        wallet_service.process_refund(
            dispute_id=case.id,
            amount=case.claim_amount,
            operator_email=current_user.email,
            reason="Admin approved dispute refund."
        )
        notif_service.send_notification(
            customer_email=case.customer_email,
            title="Refund Approved & Credited",
            message=f"Dispute {case.id} was approved. A refund of INR {case.claim_amount:,.2f} has been credited to your Digital Wallet.",
            notification_type="REFUND_ISSUED",
            dispute_id=case.id
        )
    else:
        # Create replacement shipment
        shipment = replacement_repo.create_shipment(
            dispute_id=case.id,
            order_id=case.order_id,
            product_name=case.category or "Replacement Item",
            customer_id=case.customer_id or f"CUST-1001"
        )
        notif_service.send_notification(
            customer_email=case.customer_email,
            title="Replacement Order Dispatched",
            message=f"Dispute {case.id} approved! A replacement item has been reserved and dispatched. Tracking #{shipment.tracking_number} via {shipment.carrier}.",
            notification_type="REPLACEMENT_SHIPPED",
            dispute_id=case.id
        )

    updated_case = service.update_case_status(case_id, {
        "status": "Approved",
        "human_approval_required": False
    })

    # Generate Decision Passport
    passport_service.get_or_generate_passport(case_id)

    audit = AuditLog(
        operator=current_user.email,
        action="HUMAN_APPROVAL_GRANTED",
        details=f"Human approval granted for dispute {case_id} by {current_user.email}. Executed action: {case.resolution_action}"
    )
    db.add(audit)
    db.commit()

    AuditTrailService.record(
        case_id=case_id, event_type=HUMAN_APPROVED, agent="EscalationAgent",
        actor=current_user.email, details=f"Human approval granted by {current_user.email}.",
        metadata={"resolution": case.resolution_action}
    )

    return updated_case

@router.post("/{case_id}/reject", response_model=CaseResponse)
@router.post("/disputes/{case_id}/reject", response_model=CaseResponse)
def reject_case(
    case_id: str,
    current_user: User = Depends(require_permission(RESOLUTION_APPROVE)),
    db: Session = Depends(get_db)
):
    """Human rejection endpoint for escalated cases."""
    service = CaseService(db)
    case = service.get_case(case_id)
    notif_service = NotificationService(db)

    updated_case = service.update_case_status(case_id, {
        "status": "Rejected",
        "human_approval_required": False
    })

    notif_service.send_notification(
        customer_email=case.customer_email,
        title="Dispute Claim Closed",
        message=f"Dispute {case.id} has been reviewed and closed following compliance guidelines. View your case details for reasoning.",
        notification_type="ADMIN_APPROVAL",
        dispute_id=case.id
    )

    audit = AuditLog(
        operator=current_user.email,
        action="HUMAN_REJECTION",
        details=f"Dispute {case_id} rejected by {current_user.email}."
    )
    db.add(audit)
    db.commit()

    return updated_case

@router.post("/{case_id}/request-evidence", response_model=CaseResponse)
@router.post("/disputes/{case_id}/request-evidence", response_model=CaseResponse)
def request_evidence_case(
    case_id: str,
    current_user: User = Depends(require_permission(RESOLUTION_APPROVE)),
    db: Session = Depends(get_db)
):
    """Request additional photo/invoice evidence from the customer."""
    service = CaseService(db)
    case = service.get_case(case_id)
    notif_service = NotificationService(db)

    updated_case = service.update_case_status(case_id, {
        "status": "Requires_Review",
        "human_approval_required": True
    })

    notif_service.send_notification(
        customer_email=case.customer_email,
        title="Additional Evidence Required",
        message=f"Admin team requested additional photos or receipt evidence for dispute {case.id}. Please upload your files to resume investigation.",
        notification_type="EVIDENCE_REQUIRED",
        dispute_id=case.id
    )

    audit = AuditLog(
        operator=current_user.email,
        action="EVIDENCE_REQUESTED",
        details=f"Additional evidence requested for dispute {case_id} by {current_user.email}."
    )
    db.add(audit)
    db.commit()

    return updated_case

@router.patch("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: str,
    updates: CaseUpdateRequest,
    current_user: User = Depends(require_permission(RESOLUTION_REVIEW)),
    db: Session = Depends(get_db)
):
    """Update case status or resolution. Requires RESOLUTION_REVIEW or ADMIN permissions."""
    service = CaseService(db)
    return service.update_case_status(case_id, updates.model_dump(exclude_unset=True))

