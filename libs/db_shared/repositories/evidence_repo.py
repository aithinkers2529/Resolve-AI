from sqlalchemy.orm import Session
from libs.db_shared.models.evidence import EvidenceItem
from typing import Optional, List

class EvidenceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, evidence_id: str) -> Optional[EvidenceItem]:
        return self.db.query(EvidenceItem).filter(EvidenceItem.id == evidence_id).first()

    def get_by_dispute_id(self, dispute_id: str) -> List[EvidenceItem]:
        return self.db.query(EvidenceItem).filter(EvidenceItem.dispute_id == dispute_id).all()

    def create(self, evidence_data: dict) -> EvidenceItem:
        item = EvidenceItem(**evidence_data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
