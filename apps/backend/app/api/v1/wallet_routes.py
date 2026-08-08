from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from libs.db_shared.session import get_db
from libs.db_shared.models.user import User
from app.api.deps import get_current_user
from app.services.wallet_service import WalletService
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter()

class RefundExecutionRequest(BaseModel):
    dispute_id: str
    amount: float
    reason: Optional[str] = "Dispute resolution refund authorized"

@router.get("")
@router.get("/")
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws = WalletService(db)
    return ws.get_customer_wallet(current_user.email)

@router.get("/transactions")
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws = WalletService(db)
    wallet_data = ws.get_customer_wallet(current_user.email)
    return wallet_data.get("transactions", [])

@router.post("/refunds")
def execute_refund(
    payload: RefundExecutionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws = WalletService(db)
    try:
        res = ws.process_refund(
            dispute_id=payload.dispute_id,
            amount=payload.amount,
            operator_email=current_user.email,
            reason=payload.reason
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
