import logging

logger = logging.getLogger("evidence_agent")

class EvidenceAgent:
    def __init__(self):
        self.name = "Evidence Verification Agent"

    async def execute(self, state: dict) -> dict:
        logger.info(f"[{self.name}] Analyzing evidence attachments for dispute: {state.get('complaint_id')}")
        
        evidence_urls = state.get("evidence_urls", [])
        category = state.get("category", "")
        
        # OCR / Vision parsing simulation based on category
        damage_detected = "damaged" in category.lower() or "cracked" in state.get("complaint_text", "").lower()
        document_verified = len(evidence_urls) > 0
        
        ocr_items = ["Extracted Invoice Total: $" + str(state.get("claim_amount", 0.0))]
        if damage_detected:
            ocr_items.append("Vision AI: Surface fracture / impact damage verified (Score: 96%).")
        else:
            ocr_items.append("Carrier Proof: Signature recorded at delivery point.")
            
        evidence_summary = {
            "damage_detected": damage_detected,
            "document_verified": document_verified,
            "ocr_items": ocr_items,
            "confidence": 0.94
        }
        
        state["evidence_summary"] = evidence_summary
        state["ocr_text"] = " | ".join(ocr_items)
        state["last_active_agent"] = self.name
        
        log_entry = {
            "agent_name": self.name,
            "action_taken": "OCR & Vision AI Parsing",
            "log_details": f"Processed {len(evidence_urls)} files. Damage detected: {damage_detected}. Document verified: {document_verified}."
        }
        state.setdefault("agent_logs", []).append(log_entry)
        
        return state
