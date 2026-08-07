import pytest
from ..agent import ResolutionAgent

@pytest.mark.asyncio
async def test_resolution_agent_execution():
    agent = ResolutionAgent()
    state = {"dispute_id": "DISP-TEST123", "context": "Testing resolution"}
    updated_state = await agent.execute(state)
    assert updated_state[f"resolution_results"]["success"] is True
    assert updated_state["last_active_agent"] == "ResolutionAgent"
