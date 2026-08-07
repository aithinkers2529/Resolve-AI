import logging
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("idempotency_engine")

# In-memory execution store for idempotency keys
IDEMPOTENCY_STORE: Dict[str, Dict[str, Any]] = {}

class IdempotencyEngine:
    """Idempotency Engine: Guarantees business actions (refunds, shipments, inventory) are executed exactly once per case."""

    @staticmethod
    def build_key(case_id: str, action_type: str) -> str:
        return f"{str(case_id).strip()}:{str(action_type).strip()}"

    @staticmethod
    def check_executed(case_id: str, action_type: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        key = IdempotencyEngine.build_key(case_id, action_type)
        if key in IDEMPOTENCY_STORE:
            logger.info(f"Idempotency Cache Hit: Action '{action_type}' for case '{case_id}' already executed.")
            return True, IDEMPOTENCY_STORE[key]
        return False, None

    @staticmethod
    def record_success(case_id: str, action_type: str, result: Dict[str, Any]) -> Dict[str, Any]:
        key = IdempotencyEngine.build_key(case_id, action_type)
        IDEMPOTENCY_STORE[key] = {
            "case_id": case_id,
            "action_type": action_type,
            "status": "SUCCESS",
            "result": result
        }
        logger.info(f"Idempotency Recorded: Key '{key}' registered.")
        return IDEMPOTENCY_STORE[key]
