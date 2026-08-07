from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from app.api.deps import get_current_user, require_permission
from app.core.permissions import AUDIT_VIEW, RESOLUTION_REVIEW
from app.services.analytics_service import AnalyticsService
from libs.db_shared.models.feedback import CaseFeedback, CaseAppeal
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

router = APIRouter()

class FeedbackSubmitRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class AppealSubmitRequest(BaseModel):
    appeal_reason: str

@router.get("/overview")
def get_analytics_overview(
    period: str = Query("30d", description="Time period: today, 7d, 30d, custom"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve executive dashboard top KPI metrics."""
    service = AnalyticsService(db)
    return service.get_overview_kpis(period=period)

@router.get("/cases")
def get_analytics_cases(
    period: str = Query("30d"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve case status distribution chart data."""
    service = AnalyticsService(db)
    return service.get_case_status_distribution(period=period)

@router.get("/categories")
def get_analytics_categories(
    period: str = Query("30d"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve dispute category breakdown metrics."""
    service = AnalyticsService(db)
    return service.get_dispute_category_analytics(period=period)

@router.get("/resolutions")
def get_analytics_resolutions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve resolution type distribution and success rates."""
    service = AnalyticsService(db)
    return service.get_resolution_analytics()

@router.get("/automation")
def get_analytics_automation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve automation vs human-assisted vs manual execution breakdown."""
    service = AnalyticsService(db)
    return service.get_automation_analytics()

@router.get("/escalations")
def get_analytics_escalations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve human escalation reasons and approval/rejection rates."""
    service = AnalyticsService(db)
    return service.get_human_escalation_analytics()

@router.get("/fraud")
def get_analytics_fraud(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve fraud risk tiers and top fraud signal frequency."""
    service = AnalyticsService(db)
    return service.get_fraud_analytics()

@router.get("/agents")
def get_analytics_agents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve per-agent performance metrics (executions, latency P95, confidence, tool calls)."""
    service = AnalyticsService(db)
    return service.get_agent_performance_metrics()

@router.get("/tools")
def get_analytics_tools(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve enterprise tool execution counters and latency metrics."""
    service = AnalyticsService(db)
    return service.get_tool_performance_metrics()

@router.get("/sla")
def get_analytics_sla(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve SLA compliance analytics."""
    service = AnalyticsService(db)
    return service.get_sla_analytics()

@router.get("/business-impact")
def get_analytics_business_impact(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve simulated business impact and cost savings calculations."""
    service = AnalyticsService(db)
    return service.get_business_impact()

@router.get("/benchmark")
def get_analytics_benchmark(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve AI-assisted vs Simulated Baseline benchmark report."""
    service = AnalyticsService(db)
    return service.get_benchmark_report()

@router.get("/export/csv")
def export_analytics_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export analytics summary as a downloadable CSV file."""
    service = AnalyticsService(db)
    csv_data = service.export_analytics_csv()
    return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=resolve_ai_analytics.csv"})

@router.post("/cases/{case_id}/feedback")
def submit_case_feedback(
    case_id: str,
    payload: FeedbackSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer submits 1-5 star resolution feedback rating & optional comment."""
    feedback = CaseFeedback(
        case_id=case_id,
        customer_email=current_user.email,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {
        "case_id": case_id,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "message": "Thank you for rating your dispute resolution experience."
    }

@router.post("/cases/{case_id}/appeal")
def submit_case_appeal(
    case_id: str,
    payload: AppealSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer submits formal appeal for a rejected or disputed decision."""
    appeal = CaseAppeal(
        case_id=case_id,
        customer_email=current_user.email,
        appeal_reason=payload.appeal_reason,
        status="PENDING"
    )
    db.add(appeal)
    db.commit()
    db.refresh(appeal)

    return {
        "appeal_id": appeal.id,
        "case_id": case_id,
        "status": "PENDING",
        "message": "Your appeal has been logged and routed to senior resolution management for manual review."
    }
