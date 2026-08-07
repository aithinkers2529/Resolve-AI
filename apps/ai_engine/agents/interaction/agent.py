import logging

logger = logging.getLogger("interaction_agent")

class InteractionAgent:
    def __init__(self):
        self.name = "Customer Interaction Agent"

    async def execute(self, state: dict) -> dict:
        logger.info(f"[{self.name}] Analyzing complaint text for dispute: {state.get('complaint_id')}")
        
        text = state.get("complaint_text", "").lower()
        category = state.get("category", "Damaged Product")
        
        # Categorization logic
        if "broken" in text or "cracked" in text or "damaged" in text or "shattered" in text:
            category = "Damaged Product"
        elif "never arrived" in text or "late" in text or "missing" in text:
            category = "Refund Request"
        elif "wrong" in text or "different" in text or "sku" in text:
            category = "Wrong Product"
        elif "warranty" in text or "defect" in text:
            category = "Warranty Claim"
            
        state["category"] = category
        state["status"] = "Analyzing"
        state["last_active_agent"] = self.name
        
        log_entry = {
            "agent_name": self.name,
            "action_taken": "Intent Classification & Entity Extraction",
            "log_details": f"Classified claim category as '{category}'. Sentiment: Neutral/Frustrated."
        }
        state.setdefault("agent_logs", []).append(log_entry)
        
        return state
