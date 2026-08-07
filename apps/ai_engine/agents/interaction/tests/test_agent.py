import pytest
from ..agent import InteractionAgent

@pytest.mark.asyncio
async def test_interaction_agent_execution():
    agent = InteractionAgent()
    state = {"dispute_id": "DISP-TEST123", "context": "Testing interaction"}
    updated_state = await agent.execute(state)
    assert updated_state[f"interaction_results"]["success"] is True
    assert updated_state["last_active_agent"] == "InteractionAgent"
