from sqlalchemy.orm import Session
from libs.db_shared.models.order import Order
from libs.db_shared.models.product import Product
from typing import Optional, List

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_order_by_id(self, order_id: str) -> Optional[Order]:
        return self.db.query(Order).filter(Order.id == order_id).first()

    def get_orders_by_customer(self, customer_id: str) -> List[Order]:
        return self.db.query(Order).filter(Order.customer_id == customer_id).all()

    def create_order(self, order_data: dict) -> Order:
        order = Order(**order_data)
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def get_product_by_id(self, product_id: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def get_product_by_sku(self, sku: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.sku == sku).first()

    def create_product(self, product_data: dict) -> Product:
        product = Product(**product_data)
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product
