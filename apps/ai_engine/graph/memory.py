from typing import Dict, Any
import json
import logging

logger = logging.getLogger("graph_memory")

class GraphMemoryManager:
    """Graph state checkpoint manager with automatic in-memory fallback."""
    _memory_store: Dict[str, str] = {}

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.client = None
        try:
            import redis
            self.client = redis.from_url(redis_url, socket_connect_timeout=1)
            self.client.ping()
        except Exception:
            logger.info("Redis not reachable or not configured. Using in-memory state checkpointing.")
            self.client = None

    def save_checkpoint(self, thread_id: str, state: Dict[str, Any]):
        serialized = json.dumps(state, default=str)
        if self.client:
            try:
                self.client.set(f"checkpoint:{thread_id}", serialized)
                return
            except Exception:
                pass
        self._memory_store[f"checkpoint:{thread_id}"] = serialized

    def load_checkpoint(self, thread_id: str) -> Dict[str, Any]:
        if self.client:
            try:
                data = self.client.get(f"checkpoint:{thread_id}")
                if data:
                    return json.loads(data)
            except Exception:
                pass
        raw = self._memory_store.get(f"checkpoint:{thread_id}")
        if raw:
            return json.loads(raw)
        return {}

