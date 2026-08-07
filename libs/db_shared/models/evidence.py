from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String, primary_key=True, default=lambda: f"EVID-{str(uuid.uuid4())[:8].upper()}")
    dispute_id = Column(String, ForeignKey("disputes.id"), nullable=False, index=True)
    file_url = Column(String, nullable=False)
    file_type = Column(String, default="IMAGE") # IMAGE, PDF, DOCUMENT
    ocr_text = Column(String, nullable=True)
    damage_detected = Column(Boolean, default=False)
    confidence_score = Column(String, default="0.95")
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
