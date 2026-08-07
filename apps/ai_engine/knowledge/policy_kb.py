from typing import List, Dict, Any, Optional

POLICIES_DATABASE: List[Dict[str, Any]] = [
    {
        "policy_id": "WARRANTY-4.2",
        "policy_name": "Damaged In Transit & Warranty Coverage",
        "version": "4.2",
        "category": "damaged_product",
        "effective_date": "2026-01-01",
        "time_window_hours": 720,  # 30 days
        "allowed_actions": ["Replacement", "Refund"],
        "max_refund_limit": 50000.0,
        "rules": [
            "Damage reported within 30 days of delivery is eligible for instant replacement",
            "Photos confirming physical impact damage must be attached",
            "Claims over INR 50,000 require manual verification"
        ],
        "section": "4.2 - Damaged In Transit Coverage"
    },
    {
        "policy_id": "REFUND-2.1",
        "policy_name": "Standard Damaged Product Refund Policy",
        "version": "2.1",
        "category": "damaged_product",
        "effective_date": "2026-01-01",
        "time_window_hours": 720,
        "allowed_actions": ["Refund", "Replacement"],
        "max_refund_limit": 50000.0,
        "rules": [
            "Damaged items reported within return window are eligible for full refund",
            "Original payment method will be credited within 2 business days"
        ],
        "section": "2.1 - Damaged Product Refund"
    },
    {
        "policy_id": "EXCHANGE-2.3",
        "policy_name": "Warehouse Fulfillment Error Policy",
        "version": "2.3",
        "category": "wrong_product",
        "effective_date": "2026-01-01",
        "time_window_hours": 720,
        "allowed_actions": ["Replacement", "Refund"],
        "max_refund_limit": 50000.0,
        "rules": [
            "Mismatched SKU items verified by distribution scan logs are eligible for immediate exchange or full refund"
        ],
        "section": "2.3 - Fulfillment Error"
    },
    {
        "policy_id": "HIGHVALUE-1.2",
        "policy_name": "High-Value Transaction Policy",
        "version": "1.2",
        "category": "high_value",
        "effective_date": "2026-01-01",
        "high_value_threshold": 50000.0,
        "allowed_actions": ["Escalate", "Replacement", "Refund"],
        "rules": [
            "Dispute claims exceeding INR 50,000 require mandatory human manager verification before automated execution"
        ],
        "section": "1.2 - High-Value Verification Constraint"
    },
    {
        "policy_id": "FRAUD-3.0",
        "policy_name": "High Frequency Claim Audit Policy",
        "version": "3.0",
        "category": "fraud_audit",
        "effective_date": "2026-01-01",
        "max_allowed_claims_30_days": 3,
        "allowed_actions": ["Escalate", "Reject"],
        "rules": [
            "Accounts with >3 claims in 30 days trigger mandatory human fraud review"
        ],
        "section": "3.0 - High Frequency Claim Audit"
    }
]

class PolicyKnowledgeBase:
    """Policy Knowledge Base Repository: Provides policy retrieval, search, and clause matching."""

    @staticmethod
    def get_policy(policy_id: str) -> Optional[Dict[str, Any]]:
        for p in POLICIES_DATABASE:
            if p["policy_id"].upper() == policy_id.upper():
                return p
        return None

    @staticmethod
    def search_policies(category: str, claim_amount: float = 0.0) -> List[Dict[str, Any]]:
        matched = []
        cat_lower = category.lower()
        
        for p in POLICIES_DATABASE:
            if p["category"] in cat_lower or ("damage" in cat_lower and "damage" in p["category"]):
                matched.append(p)
            elif claim_amount >= 50000.0 and p["policy_id"] == "HIGHVALUE-1.2":
                matched.append(p)
                
        if not matched:
            matched.append(POLICIES_DATABASE[0])
            
        # If high value claim, append High Value policy rule
        if claim_amount >= 50000.0 and not any(m["policy_id"] == "HIGHVALUE-1.2" for m in matched):
            hv_policy = PolicyKnowledgeBase.get_policy("HIGHVALUE-1.2")
            if hv_policy:
                matched.append(hv_policy)

        return matched
