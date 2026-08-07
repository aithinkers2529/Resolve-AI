from sqlalchemy import Column, String, DateTime, Float, Integer
from sqlalchemy.sql import func
from libs.db_shared.base import Base
import uuid

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: f"PROD-{str(uuid.uuid4())[:8].upper()}")
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    warranty_period_days = Column(Integer, default=365)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
