from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class EvidenceCreateRequest(BaseModel):
    dispute_id: Optional[str] = None
    file_url: str
    file_type: Optional[str] = "IMAGE"

class EvidenceResponse(BaseModel):
    id: str
    dispute_id: str
    file_url: str
    file_type: str
    ocr_text: Optional[str] = None
    damage_detected: bool
    confidence_score: str
    metadata_json: Optional[Dict[str, Any]] = {}
    created_at: datetime

    class Config:
        from_attributes = True
