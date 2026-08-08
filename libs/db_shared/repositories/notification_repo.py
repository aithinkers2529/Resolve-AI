from sqlalchemy.orm import Session
from libs.db_shared.models.notification import Notification
from typing import List, Optional

class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        customer_id: str,
        customer_email: str,
        title: str,
        message: str,
        notification_type: str = "INFO",
        dispute_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            customer_id=customer_id,
            customer_email=customer_email,
            dispute_id=dispute_id,
            title=title,
            message=message,
            type=notification_type,
            is_read=False
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def get_by_customer(self, customer_email: str, limit: int = 50) -> List[Notification]:
        return self.db.query(Notification).filter(
            Notification.customer_email == customer_email
        ).order_by(Notification.created_at.desc()).limit(limit).all()

    def mark_read(self, notification_id: str, customer_email: str) -> Optional[Notification]:
        notif = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.customer_email == customer_email
        ).first()
        if notif:
            notif.is_read = True
            self.db.commit()
            self.db.refresh(notif)
        return notif

    def mark_all_read(self, customer_email: str) -> int:
        count = self.db.query(Notification).filter(
            Notification.customer_email == customer_email,
            Notification.is_read == False
        ).update({"is_read": True})
        self.db.commit()
        return count
