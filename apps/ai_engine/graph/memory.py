from typing import Dict, Any
import redis
import json

class GraphMemoryManager:
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.client = redis.from_url(redis_url)

    def save_checkpoint(self, thread_id: str, state: Dict[str, Any]):
        self.client.set(f"checkpoint:{thread_id}", json.dumps(state))

    def load_checkpoint(self, thread_id: str) -> Dict[str, Any]:
        data = self.client.get(f"checkpoint:{thread_id}")
        if data:
            return json.loads(data)
        return {}
