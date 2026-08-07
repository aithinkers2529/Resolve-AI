from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: f"ORD-{str(uuid.uuid4())[:8].upper()}")
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=True, index=True)
    product_name = Column(String, nullable=False)
    order_amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="DELIVERED") # DELIVERED, SHIPPED, RETURNED, CANCELLED
    delivery_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
