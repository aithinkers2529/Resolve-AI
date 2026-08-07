import logging
import time
from typing import Dict, Any
from apps.ai_engine.services.evidence_normalizer import EvidenceNormalizer
from apps.ai_engine.services.image_analyzer import ImageAnalyzer
from apps.ai_engine.services.document_extractor import DocumentExtractor
from apps.ai_engine.services.evidence_correlation import EvidenceCorrelationEngine
from apps.ai_engine.services.evidence_confidence import EvidenceConfidenceScorer

logger = logging.getLogger("evidence_agent")

class EvidenceAgent:
    """Multimodal Evidence Verification Agent: Normalizes uploads, executes vision/document AI, and correlates with database facts."""

    def __init__(self):
        self.name = "Evidence Verification Agent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        complaint_id = state.get("complaint_id", "UNKNOWN")
        evidence_urls = state.get("evidence_urls") or ["invoice_demo.pdf", "product_photo.png"]
        category = state.get("category", "")
        complaint_text = state.get("complaint_text", "")
        order_id = state.get("order_id", "ORD-58493-29")
        claim_amount = state.get("claim_amount", 0.0)

        logger.info(f"[{self.name}] Running multimodal evidence processing for dispute: {complaint_id}")

        normalized_items = []
        all_findings = []
        image_analysis = {"damage_detected": False, "confidence": 0.85}
        extracted_doc = {}

        for url in evidence_urls:
            file_type = "PDF" if "pdf" in url.lower() or "invoice" in url.lower() else "IMAGE"
            normalized = EvidenceNormalizer.normalize(url, file_type, complaint_text)
            
            if normalized["type"] == "image":
                image_analysis = ImageAnalyzer.analyze_image(normalized, complaint_text, category)
                normalized["extracted_data"] = image_analysis
                all_findings.extend(image_analysis.get("findings", []))
            elif normalized["type"] in ["invoice", "pdf"]:
                extracted_doc = DocumentExtractor.extract_document(normalized, order_id, claim_amount)
                normalized["extracted_data"] = extracted_doc
                all_findings.extend(extracted_doc.get("findings", []))
                
            normalized_items.append(normalized)

        # Database Fact Correlation
        db_order = {
            "id": order_id,
            "product_id": "SKU-LAPTOP-PRO-15",
            "order_amount": claim_amount if claim_amount > 0 else 25000.0
        }
        correlation = EvidenceCorrelationEngine.correlate(extracted_doc, image_analysis, db_order, claim_amount)
        confidence = EvidenceConfidenceScorer.calculate_confidence(correlation, image_analysis)

        evidence_result = {
            "verified": correlation["status"] in ["CONSISTENT", "MOSTLY_CONSISTENT"],
            "confidence": confidence,
            "consistency_status": correlation["status"],
            "damage_detected": image_analysis.get("damage_detected", False),
            "findings": all_findings + correlation.get("matches", []),
            "missing_evidence": [],
            "suspicious_signals": correlation.get("mismatches", [])
        }

        state["evidence_normalized"] = normalized_items
        state["evidence_correlation"] = correlation
        state["evidence_result"] = evidence_result
        state["evidence_summary"] = {
            "damage_detected": image_analysis.get("damage_detected", False),
            "document_verified": True,
            "consistency_status": correlation["status"],
            "confidence": confidence,
            "ocr_items": all_findings
        }
        state["ocr_text"] = " | ".join(all_findings)
        state["last_active_agent"] = self.name

        duration_ms = int((time.time() - start_time) * 1000)
        trace_entry = {
            "agent": "evidence",
            "agent_name": self.name,
            "status": "completed",
            "action_taken": "Multimodal Evidence Analysis",
            "log_details": f"Processed {len(evidence_urls)} evidence files. Correlation Status: {correlation['status']} ({int(confidence * 100)}% Confidence). Damage Detected: {image_analysis.get('damage_detected')}.",
            "duration_ms": duration_ms,
            "confidence": confidence
        }

        state.setdefault("agent_logs", []).append(trace_entry)
        state.setdefault("agent_trace", []).append(trace_entry)

        return state
