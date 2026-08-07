import logging
from typing import Dict, Any

logger = logging.getLogger("evidence_confidence")

# Configurable Signal Weights
EVIDENCE_ORDER_MATCH_WEIGHT = 0.35
EVIDENCE_PRODUCT_MATCH_WEIGHT = 0.25
EVIDENCE_IMAGE_WEIGHT = 0.25
EVIDENCE_DOCUMENT_WEIGHT = 0.15

class EvidenceConfidenceScorer:
    """Evidence Confidence Scorer: Derives objective confidence from weighted verified evidence signals."""

    @staticmethod
    def calculate_confidence(correlation: Dict[str, Any], image_analysis: Dict[str, Any]) -> float:
        matches = correlation.get("matches", [])
        mismatches = correlation.get("mismatches", [])
        
        # 1. Order Match Signal
        order_match_score = 0.0 if any("Order ID mismatch" in m for m in mismatches) else 1.0
        
        # 2. Product Match Signal
        product_match_score = 0.0 if any("Product SKU mismatch" in m for m in mismatches) else 1.0
        
        # 3. Image Analysis Signal
        image_confidence = float(image_analysis.get("confidence", 0.90)) if image_analysis.get("damage_detected") else 0.85
        
        # 4. Document Extraction Signal
        doc_confidence = 0.95 if correlation.get("status") in ["CONSISTENT", "MOSTLY_CONSISTENT"] else 0.40
        
        weighted_score = (
            (order_match_score * EVIDENCE_ORDER_MATCH_WEIGHT) +
            (product_match_score * EVIDENCE_PRODUCT_MATCH_WEIGHT) +
            (image_confidence * EVIDENCE_IMAGE_WEIGHT) +
            (doc_confidence * EVIDENCE_DOCUMENT_WEIGHT)
        )
        
        return round(min(weighted_score, 0.99), 2)
