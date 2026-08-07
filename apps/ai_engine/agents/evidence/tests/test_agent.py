import pytest
from ..agent import EvidenceAgent

@pytest.mark.asyncio
async def test_evidence_agent_execution():
    agent = EvidenceAgent()
    state = {"dispute_id": "DISP-TEST123", "context": "Testing evidence"}
    updated_state = await agent.execute(state)
    assert updated_state[f"evidence_results"]["success"] is True
    assert updated_state["last_active_agent"] == "EvidenceAgent"
