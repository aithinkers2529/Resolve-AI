from typing import Dict, Any, List

# Policy Knowledge Base
POLICIES_DATABASE = [
    {
        "id": "POL-402",
        "category": "Damaged Product",
        "reference": "Refund Policy Section 4.2 - Damaged In Transit Coverage",
        "text": "Products damaged during shipping are eligible for immediate replacement or full refund if reported within 30 days of delivery with photo evidence.",
        "rule": "Eligible"
    },
    {
        "id": "POL-201",
        "category": "Warranty Claim",
        "reference": "Warranty Policy Section 2.1 - 1-Year Hardware Guarantee",
        "text": "Hardware defects reported within 12 months qualify for free repair or factory replacement.",
        "rule": "Eligible"
    },
    {
        "id": "POL-203",
        "category": "Wrong Product",
        "reference": "Exchange Policy Section 2.3 - Fulfillment Error",
        "text": "If customer receives an item mismatched from the order invoice, company provides prepaid return label and dispatches correct item immediately.",
        "rule": "Eligible"
    },
    {
        "id": "POL-801",
        "category": "Refund Request",
        "reference": "Policy Section 8.1 - High Frequency Claim Audit",
        "text": "Customers submitting more than 3 non-receipt refund claims within 30 days require mandatory manual audit and delivery signature verification.",
        "rule": "Audit Required"
    }
]

class RAGPipeline:
    def __init__(self):
        self.policies = POLICIES_DATABASE

    def retrieve_policy(self, category: str, complaint_text: str, history_count: int = 0) -> Dict[str, Any]:
        """Perform semantic policy search against category and history keywords."""
        if history_count >= 3 or "never arrived" in complaint_text.lower() or "refund" in category.lower():
            # Match high frequency policy
            p = self.policies[3]
            return {
                "eligible": "Ineligible - Audit Required",
                "policy_reference": p["reference"],
                "policy_notes": p["text"]
            }
        
        # Search by category match
        for p in self.policies:
            if p["category"].lower() in category.lower():
                return {
                    "eligible": "Eligible",
                    "policy_reference": p["reference"],
                    "policy_notes": p["text"]
                }
                
        # Default fallback match
        return {
            "eligible": "Eligible",
            "policy_reference": "Standard Customer Protection Policy 1.0",
            "policy_notes": "Claim satisfies general customer resolution policy terms."
        }
