from typing import Any
import logging

logger = logging.getLogger("graph_bus")

def publish_agent_message(agent_name: str, message: str):
    """Post agent state update messages to message brokers (e.g. Redis PubSub)."""
    logger.info(f"[{agent_name}]: {message}")
