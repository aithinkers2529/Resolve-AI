import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("case_memory")

# In-memory Case Memory index (seeded & live)
CASE_MEMORY_DB: List[Dict[str, Any]] = [
    {
        "case_id": "DISP-1001",
        "category": "Damaged Product",
        "claim_amount": 25000.0,
        "fraud_score": 0.08,
        "policy_ref": "WARRANTY-4.2",
        "resolution_action": "Replacement",
        "customer_rating": 5,
        "summary": "Cracked screen on laptop verified by OCR invoice & image analysis. Instant replacement authorized under Section 4.2."
    },
    {
        "case_id": "DISP-1021",
        "category": "Damaged Product",
        "claim_amount": 899.99,
        "fraud_score": 0.05,
        "policy_ref": "WARRANTY-4.2",
        "resolution_action": "Replacement",
        "customer_rating": 5,
        "summary": "Damaged smartphone display verified by vision analyzer. Replacement order dispatched autonomously."
    },
    {
        "case_id": "DISP-1032",
        "category": "Damaged Product",
        "claim_amount": 75000.0,
        "fraud_score": 0.12,
        "policy_ref": "HIGHVALUE-1.2",
        "resolution_action": "Replacement",
        "customer_rating": 4,
        "summary": "Crushed chassis on ₹75,000 workstation laptop. Escalated to manager due to high value threshold. Approved for replacement."
    },
    {
        "case_id": "DISP-1045",
        "category": "Fraud Alert",
        "claim_amount": 1450.0,
        "fraud_score": 0.88,
        "policy_ref": "FRAUD-3.0",
        "resolution_action": "Escalate",
        "customer_rating": 1,
        "summary": "5 previous refund claims within 30 days. Carrier signature confirmed delivery. Escalated & rejected."
    }
]

class CaseMemoryStore:
    """Case Memory Store: Indexes historical dispute resolutions for pattern correlation."""

    @staticmethod
    def store_case(case_data: Dict[str, Any]) -> Dict[str, Any]:
        entry = {
            "case_id": case_data.get("case_id") or case_data.get("complaint_id", "UNKNOWN"),
            "category": case_data.get("category", "Damaged Product"),
            "claim_amount": float(case_data.get("claim_amount", 0.0)),
            "fraud_score": float(case_data.get("fraud_score", 0.0)),
            "policy_ref": case_data.get("policy_reference", "WARRANTY-4.2"),
            "resolution_action": case_data.get("resolution_action", "Replacement"),
            "customer_rating": case_data.get("customer_rating", 5),
            "summary": case_data.get("summary") or f"Case {case_data.get('complaint_id')} processed."
        }
        CASE_MEMORY_DB.append(entry)
        logger.info(f"[CaseMemory] Indexed memory for case {entry['case_id']}")
        return entry

    @staticmethod
    def search_similar_cases(category: str, claim_amount: Optional[float] = None, limit: int = 3) -> List[Dict[str, Any]]:
        """Searches historical cases matching category or claim range as supporting context."""
        results = [m for m in CASE_MEMORY_DB if category.lower() in m["category"].lower()]
        if not results:
            results = CASE_MEMORY_DB[:limit]
        return results[:limit]
