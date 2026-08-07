import pytest
from ..agent import PolicyAgent

@pytest.mark.asyncio
async def test_policy_agent_execution():
    agent = PolicyAgent()
    state = {"dispute_id": "DISP-TEST123", "context": "Testing policy"}
    updated_state = await agent.execute(state)
    assert updated_state[f"policy_results"]["success"] is True
    assert updated_state["last_active_agent"] == "PolicyAgent"
