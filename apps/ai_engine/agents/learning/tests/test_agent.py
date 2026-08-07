import pytest
from ..agent import LearningAgent

@pytest.mark.asyncio
async def test_learning_agent_execution():
    agent = LearningAgent()
    state = {"dispute_id": "DISP-TEST123", "context": "Testing learning"}
    updated_state = await agent.execute(state)
    assert updated_state[f"learning_results"]["success"] is True
    assert updated_state["last_active_agent"] == "LearningAgent"
