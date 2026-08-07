from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductResponse(BaseModel):
    id: str
    sku: str
    name: str
    category: str
    price: float
    warranty_period_days: int

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    product_id: Optional[str] = None
    product_name: str
    order_amount: float
    currency: str
    status: str
    delivery_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
