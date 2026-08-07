from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    account_age_days: int
    total_orders_count: int
    total_claims_count: int
    risk_rating: str
    created_at: datetime

    class Config:
        from_attributes = True
