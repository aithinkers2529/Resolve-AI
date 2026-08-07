import pytest
from ..agent import WorkflowAgent

@pytest.mark.asyncio
async def test_workflow_agent_execution():
    agent = WorkflowAgent()
    state = {"dispute_id": "DISP-TEST123", "context": "Testing workflow"}
    updated_state = await agent.execute(state)
    assert updated_state[f"workflow_results"]["success"] is True
    assert updated_state["last_active_agent"] == "WorkflowAgent"
