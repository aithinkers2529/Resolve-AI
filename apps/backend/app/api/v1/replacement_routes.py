from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from libs.db_shared.repositories.replacement_repo import ReplacementRepository
from libs.db_shared.repositories.dispute_repo import DisputeRepository
from libs.db_shared.models.audit import AuditLog
from app.api.deps import get_current_user
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

class ReplacementTriggerRequest(BaseModel):
    dispute_id: str
    order_id: str
    product_name: str
    delivery_address: Optional[str] = "42, Tech Innovation Corridor, Bengaluru, KA - 560100"

@router.post("")
@router.post("/")
def trigger_replacement(
    payload: ReplacementTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = ReplacementRepository(db)
    dispute_repo = DisputeRepository(db)

    dispute = dispute_repo.get_by_id(payload.dispute_id)
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")

    shipment = repo.create_shipment(
        dispute_id=dispute.id,
        order_id=payload.order_id,
        product_name=payload.product_name,
        customer_id=dispute.customer_id or f"CUST-1001",
        delivery_address=payload.delivery_address
    )

    dispute.status = "RESOLVED"
    dispute.resolution_action = "Replacement"
    dispute.resolution_reason = f"Replacement order created. Tracking #{shipment.tracking_number} via {shipment.carrier}."
    db.commit()

    audit = AuditLog(
        operator=current_user.email,
        action="REPLACEMENT_SHIPPED",
        details=f"Replacement dispatched for dispute {dispute.id}. Tracking #{shipment.tracking_number}."
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "shipment_id": shipment.id,
        "tracking_number": shipment.tracking_number,
        "carrier": shipment.carrier,
        "status": shipment.status,
        "estimated_delivery": shipment.estimated_delivery.isoformat() if shipment.estimated_delivery else None
    }

@router.get("/{dispute_id}")
def get_replacement(
    dispute_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = ReplacementRepository(db)
    shipment = repo.get_by_dispute_id(dispute_id)
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No replacement shipment found for this dispute")
    return {
        "id": shipment.id,
        "dispute_id": shipment.dispute_id,
        "order_id": shipment.order_id,
        "product_name": shipment.product_name,
        "tracking_number": shipment.tracking_number,
        "carrier": shipment.carrier,
        "status": shipment.status,
        "delivery_address": shipment.delivery_address,
        "estimated_delivery": shipment.estimated_delivery.isoformat() if shipment.estimated_delivery else None,
        "created_at": shipment.created_at.isoformat() if shipment.created_at else None
    }
