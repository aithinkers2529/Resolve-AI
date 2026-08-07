from pydantic import BaseModel, Field
from typing import Optional, List

class PolicyInput(BaseModel):
    dispute_id: str = Field(..., description="ID of the dispute")
    context: str = Field(..., description="Interaction context payload")

class PolicyOutput(BaseModel):
    success: bool = Field(..., description="Whether agent completed successfully")
    notes: Optional[str] = Field(None, description="Analysis notes from the agent")
    confidence_score: float = Field(0.0, description="Confidence/risk score evaluation")
