"""
Immutable Append-Only Audit Trail Service.

IMPORTANT: Only GET and POST operations are permitted.
No PUT or DELETE operations on audit records - this guarantees immutability.
"""
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger("audit_service")

# Audit event type constants
CASE_CREATED = "CASE_CREATED"
EVIDENCE_ANALYZED = "EVIDENCE_ANALYZED"
POLICY_RETRIEVED = "POLICY_RETRIEVED"
FRAUD_ANALYZED = "FRAUD_ANALYZED"
RESOLUTION_GENERATED = "RESOLUTION_GENERATED"
AUTO_APPROVAL = "AUTO_APPROVAL"
HUMAN_REVIEW_REQUESTED = "HUMAN_REVIEW_REQUESTED"
HUMAN_APPROVED = "HUMAN_APPROVED"
HUMAN_REJECTED = "HUMAN_REJECTED"
INFO_REQUESTED = "INFO_REQUESTED"
ORDER_VERIFIED = "ORDER_VERIFIED"
INVENTORY_RESERVED = "INVENTORY_RESERVED"
REFUND_CREATED = "REFUND_CREATED"
SHIPMENT_CREATED = "SHIPMENT_CREATED"
PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
CUSTOMER_NOTIFIED = "CUSTOMER_NOTIFIED"
CASE_RESOLVED = "CASE_RESOLVED"
IDEMPOTENCY_CACHE_HIT = "IDEMPOTENCY_CACHE_HIT"
TOOL_PERMISSION_DENIED = "TOOL_PERMISSION_DENIED"

# In-memory append-only audit log (POST-only, no DELETE/UPDATE)
_AUDIT_LOG: List[Dict[str, Any]] = []

class AuditTrailService:
    """Immutable append-only audit trail service. No updates or deletions allowed."""

    @staticmethod
    def _generate_event_id() -> str:
        return f"EVT-{uuid.uuid4().hex[:8].upper()}"

    @staticmethod
    def record(
        case_id: str,
        event_type: str,
        agent: str,
        actor: str,
        details: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """POST an immutable audit event. This is the only write operation allowed."""
        event = {
            "event_id": AuditTrailService._generate_event_id(),
            "case_id": case_id,
            "event_type": event_type,
            "agent": agent,
            "actor": actor,
            "details": details,
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "immutable": True
        }
        _AUDIT_LOG.append(event)
        logger.info(f"[AUDIT] {event_type} | Case {case_id} | Actor: {actor} | {details}")
        return event

    @staticmethod
    def get_events_for_case(case_id: str) -> List[Dict[str, Any]]:
        """GET audit events for a given case (read-only)."""
        return [e for e in _AUDIT_LOG if e["case_id"] == case_id]

    @staticmethod
    def get_all_events(limit: int = 200) -> List[Dict[str, Any]]:
        """GET all audit events (read-only)."""
        return _AUDIT_LOG[-limit:]

    @staticmethod
    def get_execution_timeline(case_id: str) -> List[Dict[str, Any]]:
        """GET time-ordered execution timeline for a case."""
        events = AuditTrailService.get_events_for_case(case_id)
        return sorted(events, key=lambda e: e["timestamp"])

    @staticmethod
    def get_event_count() -> int:
        return len(_AUDIT_LOG)


# Module-level helper for quick recording
def audit_record(case_id: str, event_type: str, agent: str, actor: str, details: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return AuditTrailService.record(case_id, event_type, agent, actor, details, metadata)
