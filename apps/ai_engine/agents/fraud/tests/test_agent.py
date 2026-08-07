import pytest
from ..agent import FraudAgent

@pytest.mark.asyncio
async def test_fraud_agent_execution():
    agent = FraudAgent()
    state = {"dispute_id": "DISP-TEST123", "context": "Testing fraud"}
    updated_state = await agent.execute(state)
    assert updated_state[f"fraud_results"]["success"] is True
    assert updated_state["last_active_agent"] == "FraudAgent"
