import logging
from typing import Dict, Any

logger = logging.getLogger("mock_inventory")

# In-memory inventory catalog
INVENTORY_CATALOG: Dict[str, Dict[str, Any]] = {
    "SKU-LAPTOP-PRO-15": {"product_name": "Luxury Laptop Core i5", "stock_quantity": 12, "available": True},
    "SKU-WORK-99": {"product_name": "Custom Workstation Laptop", "stock_quantity": 5, "available": True},
    "KB-TITAN": {"product_name": "Titanium Mechanical Keyboard", "stock_quantity": 8, "available": True},
    "SKU-OUT-OF-STOCK": {"product_name": "Out of Stock Item", "stock_quantity": 0, "available": False}
}

class MockInventoryAPI:
    """Mock Enterprise Inventory API Service: Checks real-time stock availability for candidate resolution validation."""

    @staticmethod
    def check_stock(sku: str) -> Dict[str, Any]:
        sku_clean = str(sku).strip().upper()
        
        if "OUT_OF_STOCK" in sku_clean or "ZERO" in sku_clean:
            return {
                "sku": sku_clean,
                "available": False,
                "stock_quantity": 0,
                "message": f"Product SKU '{sku_clean}' is currently out of stock."
            }
            
        item = INVENTORY_CATALOG.get(sku_clean)
        if item:
            return {
                "sku": sku_clean,
                "product_name": item["product_name"],
                "available": item["available"],
                "stock_quantity": item["stock_quantity"],
                "message": f"Product SKU '{sku_clean}' has {item['stock_quantity']} units available in warehouse."
            }
            
        # Default fallback for unknown SKUs
        return {
            "sku": sku_clean,
            "available": True,
            "stock_quantity": 10,
            "message": f"Product SKU '{sku_clean}' verified in central warehouse (10 units available)."
        }
