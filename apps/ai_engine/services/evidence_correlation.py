import logging
from typing import Dict, Any, List

logger = logging.getLogger("evidence_correlation")

class EvidenceCorrelationEngine:
    """Evidence Correlation Engine: Deterministically cross-references extracted evidence against enterprise database facts."""

    @staticmethod
    def correlate(
        extracted_doc: Dict[str, Any],
        image_analysis: Dict[str, Any],
        db_order: Dict[str, Any],
        claim_amount: float
    ) -> Dict[str, Any]:
        matches = []
        mismatches = []
        warnings = []
        
        doc_order = str(extracted_doc.get("order_id", "")).strip()
        db_order_id = str(db_order.get("id") or db_order.get("order_id", "")).strip()
        
        # 1. Order ID Verification
        if doc_order and db_order_id and doc_order.upper() == db_order_id.upper():
            matches.append(f"Order ID match ({db_order_id})")
        elif doc_order and db_order_id:
            mismatches.append(f"Order ID mismatch: Extracted '{doc_order}' vs DB '{db_order_id}'")
            
        # 2. Product SKU Verification
        doc_sku = str(extracted_doc.get("product_id", "")).strip()
        db_sku = str(db_order.get("product_id") or db_order.get("sku", "")).strip()
        if doc_sku and db_sku and doc_sku.upper() in db_sku.upper() or db_sku.upper() in doc_sku.upper():
            matches.append(f"Product SKU match ({db_sku})")
        elif doc_sku and db_sku:
            mismatches.append(f"Product SKU mismatch: Extracted '{doc_sku}' vs DB '{db_sku}'")
            
        # 3. Transaction Amount Verification
        doc_amount = float(extracted_doc.get("amount", 0.0))
        db_amount = float(db_order.get("order_amount") or db_order.get("price", claim_amount))
        
        if abs(doc_amount - db_amount) < 1.0:
            matches.append(f"Purchase Amount match (INR {db_amount:,.2f})")
        else:
            mismatches.append(f"Amount mismatch: Invoice total INR {doc_amount:,.2f} vs DB record INR {db_amount:,.2f}")
            warnings.append("Evidence inconsistency detected — purchase amount mismatch requires additional verification.")

        # 4. Consistency Status Calculation
        if len(mismatches) == 0 and len(matches) >= 2:
            status = "CONSISTENT"
            consistency_score = 0.95
        elif len(mismatches) == 0 and len(matches) >= 1:
            status = "MOSTLY_CONSISTENT"
            consistency_score = 0.85
        elif len(mismatches) > 0:
            status = "INCONSISTENT"
            consistency_score = 0.45
        else:
            status = "INSUFFICIENT_EVIDENCE"
            consistency_score = 0.50

        return {
            "consistency_score": consistency_score,
            "status": status,
            "matches": matches,
            "mismatches": mismatches,
            "warnings": warnings
        }
