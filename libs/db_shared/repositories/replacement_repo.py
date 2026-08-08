from sqlalchemy.orm import Session
from libs.db_shared.models.replacement import ReplacementShipment
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

class ReplacementRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_shipment(
        self,
        dispute_id: str,
        order_id: str,
        product_name: str,
        customer_id: str,
        carrier: str = "BlueDart Express",
        delivery_address: Optional[str] = "42, Tech Innovation Corridor, Bengaluru, KA - 560100"
    ) -> ReplacementShipment:
        existing = self.db.query(ReplacementShipment).filter(
            ReplacementShipment.dispute_id == dispute_id
        ).first()
        if existing:
            return existing

        tracking = f"TRK-EXPRESS-{str(uuid.uuid4())[:8].upper()}"
        est_delivery = datetime.now(timezone.utc) + timedelta(days=2)

        shipment = ReplacementShipment(
            dispute_id=dispute_id,
            order_id=order_id,
            product_name=product_name,
            customer_id=customer_id,
            tracking_number=tracking,
            carrier=carrier,
            status="DISPATCHED",
            delivery_address=delivery_address,
            estimated_delivery=est_delivery
        )
        self.db.add(shipment)
        self.db.commit()
        self.db.refresh(shipment)
        return shipment

    def get_by_dispute_id(self, dispute_id: str) -> Optional[ReplacementShipment]:
        return self.db.query(ReplacementShipment).filter(
            ReplacementShipment.dispute_id == dispute_id
        ).first()

    def get_all(self, limit: int = 50) -> List[ReplacementShipment]:
        return self.db.query(ReplacementShipment).order_by(ReplacementShipment.created_at.desc()).limit(limit).all()
