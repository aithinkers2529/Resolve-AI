import pytest
from ..agent import EscalationAgent

@pytest.mark.asyncio
async def test_escalation_agent_execution():
    agent = EscalationAgent()
    state = {"dispute_id": "DISP-TEST123", "context": "Testing escalation"}
    updated_state = await agent.execute(state)
    assert updated_state[f"escalation_results"]["success"] is True
    assert updated_state["last_active_agent"] == "EscalationAgent"
