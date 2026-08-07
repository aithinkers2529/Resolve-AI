from sqlalchemy.orm import Session
from libs.db_shared.repositories.evidence_repo import EvidenceRepository
from libs.db_shared.repositories.dispute_repo import DisputeRepository
from app.core.exceptions import CaseNotFoundException
from libs.db_shared.models.evidence import EvidenceItem
from typing import List

class EvidenceService:
    def __init__(self, db: Session):
        self.evidence_repo = EvidenceRepository(db)
        self.dispute_repo = DisputeRepository(db)

    def get_case_evidence(self, dispute_id: str) -> List[EvidenceItem]:
        dispute = self.dispute_repo.get_by_id(dispute_id)
        if not dispute:
            raise CaseNotFoundException(dispute_id)
        return self.evidence_repo.get_by_dispute_id(dispute_id)

    def register_evidence(self, dispute_id: str, file_url: str, file_type: str = "IMAGE") -> EvidenceItem:
        dispute = self.dispute_repo.get_by_id(dispute_id)
        if not dispute:
            raise CaseNotFoundException(dispute_id)
            
        evidence_data = {
            "dispute_id": dispute_id,
            "file_url": file_url,
            "file_type": file_type,
            "damage_detected": False,
            "ocr_text": ""
        }
        
        # Insert evidence item
        item = self.evidence_repo.create(evidence_data)
        
        # Append URL to Dispute model evidence list for UI integration
        urls = list(dispute.evidence_urls or [])
        urls.append(file_url)
        self.dispute_repo.update(dispute_id, {"evidence_urls": urls})
        
        return item
