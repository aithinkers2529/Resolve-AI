import uuid
from datetime import datetime, timezone
from typing import Dict, Any

class MockOrderAPI:
    @staticmethod
    def get_order_details(order_id: str) -> Dict[str, Any]:
        return {
            "order_id": order_id,
            "status": "DELIVERED",
            "item_name": "Luxury Laptop Core i5",
            "sku": "SKU-LAPTOP-PRO-15",
            "price": 25000.0,
            "currency": "INR",
            "delivered_at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def update_order_status(order_id: str, new_status: str) -> Dict[str, Any]:
        return {
            "order_id": order_id,
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

class MockPaymentAPI:
    @staticmethod
    def process_refund(order_id: str, amount: float, customer_email: str) -> Dict[str, Any]:
        tx_id = f"REF-{uuid.uuid4().hex[:8].upper()}"
        return {
            "refund_id": tx_id,
            "transaction_id": tx_id,
            "order_id": order_id,
            "amount": amount,
            "refund_amount": amount,
            "currency": "INR",
            "customer_email": customer_email,
            "status": "processed",
            "processed_at": datetime.now(timezone.utc).isoformat()
        }

class MockInventoryAPI:
    @staticmethod
    def check_stock_and_reserve(sku: str) -> Dict[str, Any]:
        return MockInventoryAPI.reserve_inventory(sku, 1)

    @staticmethod
    def reserve_inventory(sku: str, quantity: int = 1) -> Dict[str, Any]:
        res_id = f"RES-{uuid.uuid4().hex[:6].upper()}"
        return {
            "reservation_id": res_id,
            "product_id": sku,
            "sku": sku,
            "quantity": quantity,
            "in_stock": True,
            "status": "reserved",
            "warehouse": "BLR-HUB-04",
            "reserved_at": datetime.now(timezone.utc).isoformat()
        }

class MockShippingAPI:
    @staticmethod
    def create_replacement_shipment(order_id: str, sku: str, destination_email: str) -> Dict[str, Any]:
        shipment_id = f"SHIP-{uuid.uuid4().hex[:8].upper()}"
        waybill = f"WB-{uuid.uuid4().hex[:8].upper()}"
        return {
            "shipment_id": shipment_id,
            "waybill_number": waybill,
            "carrier": "ExpressLogistics India",
            "order_id": order_id,
            "sku": sku,
            "pickup_scheduled": "Tomorrow 10:00 AM",
            "estimated_delivery": "2 Business Days",
            "status": "created",
            "tracking_number": waybill
        }

    @staticmethod
    def schedule_pickup(order_id: str) -> Dict[str, Any]:
        pickup_id = f"PKP-{uuid.uuid4().hex[:6].upper()}"
        return {
            "pickup_id": pickup_id,
            "order_id": order_id,
            "status": "SCHEDULED",
            "time": "Tomorrow 10:00 AM"
        }

class MockNotificationAPI:
    @staticmethod
    def send_customer_notice(email: str, subject: str, message: str) -> Dict[str, Any]:
        msg_id = f"NOTIF-{uuid.uuid4().hex[:6].upper()}"
        return {
            "notification_id": msg_id,
            "message_id": msg_id,
            "channel": "email",
            "recipient": email,
            "subject": subject,
            "message": message,
            "status": "sent",
            "sent_at": datetime.now(timezone.utc).isoformat()
        }
