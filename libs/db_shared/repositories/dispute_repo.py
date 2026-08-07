from sqlalchemy.orm import Session
from sqlalchemy import func
from libs.db_shared.models.dispute import Dispute
from libs.db_shared.models.agent_log import AgentLog
from libs.db_shared.models.audit import AuditLog
from typing import List, Optional, Dict, Any

class DisputeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, dispute_id: str) -> Optional[Dispute]:
        return self.db.query(Dispute).filter(Dispute.id == dispute_id).first()

    def get_all(self, skip: int = 0, limit: int = 50) -> List[Dispute]:
        return self.db.query(Dispute).order_by(Dispute.created_at.desc()).offset(skip).limit(limit).all()

    def create(self, dispute_data: dict) -> Dispute:
        db_dispute = Dispute(**dispute_data)
        self.db.add(db_dispute)
        self.db.commit()
        self.db.refresh(db_dispute)
        return db_dispute

    def update(self, dispute_id: str, updates: dict) -> Optional[Dispute]:
        db_dispute = self.get_by_id(dispute_id)
        if not db_dispute:
            return None
        for key, val in updates.items():
            if hasattr(db_dispute, key):
                setattr(db_dispute, key, val)
        self.db.commit()
        self.db.refresh(db_dispute)
        return db_dispute

    def add_agent_log(self, log_data: dict) -> AgentLog:
        db_log = AgentLog(**log_data)
        self.db.add(db_log)
        self.db.commit()
        self.db.refresh(db_log)
        return db_log

    def get_agent_logs(self, dispute_id: str) -> List[AgentLog]:
        return self.db.query(AgentLog).filter(AgentLog.dispute_id == dispute_id).order_by(AgentLog.created_at.asc()).all()

    def get_stats(self) -> Dict[str, Any]:
        total = self.db.query(Dispute).count()
        pending = self.db.query(Dispute).filter(Dispute.status.in_(["New", "Analyzing", "Requires_Review", "Fraud_Hold"])).count()
        resolved = self.db.query(Dispute).filter(Dispute.status.in_(["Approved", "Rejected", "Resolved"])).count()
        fraud = self.db.query(Dispute).filter(Dispute.fraud_score > 0.6).count()
        avg_confidence = self.db.query(func.avg(Dispute.confidence)).scalar() or 0.92
        return {
            "total_complaints": total,
            "pending_cases": pending,
            "resolved_cases": resolved,
            "fraud_detected_cases": fraud,
            "avg_confidence_score": round(float(avg_confidence), 2)
        }

    def log_audit(self, audit_data: dict) -> AuditLog:
        db_audit = AuditLog(**audit_data)
        self.db.add(db_audit)
        self.db.commit()
        self.db.refresh(db_audit)
        return db_audit
