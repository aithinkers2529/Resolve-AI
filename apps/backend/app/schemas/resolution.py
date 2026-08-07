from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ResolutionResponse(BaseModel):
    id: str
    dispute_id: str
    decision: str
    status: str
    reason: Optional[str] = None
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True
