from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from app.services.evidence_service import EvidenceService
from app.services.case_service import CaseService
from app.schemas.evidence import EvidenceResponse, EvidenceCreateRequest
from app.api.deps import get_current_user, require_permission, check_case_ownership
from app.core.permissions import EVIDENCE_VIEW, EVIDENCE_UPLOAD
from typing import List

router = APIRouter()

@router.get("/{case_id}/evidence", response_model=List[EvidenceResponse])
def get_case_evidence(
    case_id: str,
    current_user: User = Depends(require_permission(EVIDENCE_VIEW)),
    db: Session = Depends(get_db)
):
    case_service = CaseService(db)
    case = case_service.get_case(case_id)
    check_case_ownership(case, current_user)

    evidence_service = EvidenceService(db)
    return evidence_service.get_case_evidence(case_id)

@router.post("/{case_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def register_evidence(
    case_id: str,
    payload: EvidenceCreateRequest,
    current_user: User = Depends(require_permission(EVIDENCE_UPLOAD)),
    db: Session = Depends(get_db)
):
    case_service = CaseService(db)
    case = case_service.get_case(case_id)
    check_case_ownership(case, current_user)

    evidence_service = EvidenceService(db)
    target_id = payload.dispute_id or case_id
    return evidence_service.register_evidence(target_id, payload.file_url, payload.file_type)
