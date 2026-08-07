from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AgentRunResponse(BaseModel):
    id: str
    dispute_id: str
    agent_name: str
    status: str
    action_taken: str
    log_details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
