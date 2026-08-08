from sqlalchemy.orm import Session
from libs.db_shared.repositories.notification_repo import NotificationRepository
from typing import List, Dict, Any

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)

    def list_notifications(self, customer_email: str) -> List[Dict[str, Any]]:
        notifs = self.repo.get_by_customer(customer_email)
        return [
            {
                "id": n.id,
                "customer_id": n.customer_id,
                "customer_email": n.customer_email,
                "dispute_id": n.dispute_id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None
            } for n in notifs
        ]

    def send_notification(
        self,
        customer_email: str,
        title: str,
        message: str,
        notification_type: str = "INFO",
        dispute_id: str = None,
        customer_id: str = None
    ):
        cid = customer_id or f"CUST-{abs(hash(customer_email)) % 10000:04d}"
        return self.repo.create(
            customer_id=cid,
            customer_email=customer_email,
            title=title,
            message=message,
            notification_type=notification_type,
            dispute_id=dispute_id
        )

    def mark_as_read(self, notification_id: str, customer_email: str) -> bool:
        res = self.repo.mark_read(notification_id, customer_email)
        return res is not None

    def mark_all_as_read(self, customer_email: str) -> int:
        return self.repo.mark_all_read(customer_email)
