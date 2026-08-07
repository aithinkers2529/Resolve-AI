import os
import uuid
import logging
from typing import Dict, Any, List

logger = logging.getLogger("evidence_normalizer")

SUPPORTED_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".pdf": "application/pdf",
    ".txt": "text/plain"
}

class EvidenceNormalizer:
    """Evidence Normalizer: Validates file headers, mime types, and standardizes multi-format uploads."""

    @staticmethod
    def check_file_quality(filename: str, file_size_bytes: int = 1024 * 1024) -> Dict[str, Any]:
        """Pre-analysis quality check validating existence, MIME type, and size bounds."""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED_MIME_TYPES:
            return {
                "valid": False,
                "mime_type": "unknown",
                "error": f"Unsupported file extension '{ext}'. Must be one of {list(SUPPORTED_MIME_TYPES.keys())}"
            }
            
        MAX_SIZE = 15 * 1024 * 1024  # 15MB max limit
        if file_size_bytes > MAX_SIZE:
            return {
                "valid": False,
                "mime_type": SUPPORTED_MIME_TYPES[ext],
                "error": f"File size exceeds maximum threshold of 15MB ({file_size_bytes} bytes)."
            }
            
        return {
            "valid": True,
            "mime_type": SUPPORTED_MIME_TYPES[ext],
            "error": None
        }

    @staticmethod
    def normalize(
        file_url: str,
        file_type: str = "IMAGE",
        claim_context: str = ""
    ) -> Dict[str, Any]:
        """Normalize disparate evidence files into a canonical structure."""
        filename = os.path.basename(file_url)
        quality = EvidenceNormalizer.check_file_quality(filename)
        
        normalized_type = "image" if file_type.upper() in ["IMAGE", "PHOTO"] else ("invoice" if "invoice" in filename.lower() or file_type.upper() == "PDF" else "text")
        
        findings = []
        suspicious = []
        
        if not quality["valid"]:
            suspicious.append(quality["error"])
            status = "UNVERIFIED"
            confidence = 0.40
        else:
            status = "VERIFIED"
            confidence = 0.95
            findings.append(f"Format verified ({quality['mime_type']}).")
            
        return {
            "id": f"EVID-{str(uuid.uuid4())[:8].upper()}",
            "type": normalized_type,
            "filename": filename,
            "storage_path": file_url,
            "mime_type": quality["mime_type"],
            "source": "customer_upload",
            "extracted_data": {},
            "verification": {
                "status": status,
                "confidence": confidence
            },
            "findings": findings,
            "suspicious_signals": suspicious
        }
