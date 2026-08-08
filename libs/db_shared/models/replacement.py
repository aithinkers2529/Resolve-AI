from sqlalchemy import Column, String, DateTime, Float
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class ReplacementShipment(Base):
    __tablename__ = "replacement_shipments"

    id = Column(String, primary_key=True, default=lambda: f"REP-{str(uuid.uuid4())[:8].upper()}")
    dispute_id = Column(String, nullable=False, unique=True, index=True)
    order_id = Column(String, nullable=False, index=True)
    product_id = Column(String, nullable=True)
    product_name = Column(String, nullable=False)
    customer_id = Column(String, nullable=False, index=True)
    tracking_number = Column(String, nullable=False, unique=True)
    carrier = Column(String, default="BlueDart Express")
    status = Column(String, default="DISPATCHED")  # REQUESTED, RESERVED, DISPATCHED, IN_TRANSIT, DELIVERED
    delivery_address = Column(String, nullable=True)
    estimated_delivery = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
