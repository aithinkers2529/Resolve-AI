from .state import ComplaintState
from .routing import route_after_fraud, route_after_resolution

# Import Agents
from agents.interaction.agent import InteractionAgent
from agents.evidence.agent import EvidenceAgent
from agents.policy.agent import PolicyAgent
from agents.fraud.agent import FraudAgent
from agents.resolution.agent import ResolutionAgent
from agents.workflow.agent import WorkflowAgent
from agents.escalation.agent import EscalationAgent
from agents.learning.agent import LearningAgent

# Check if langgraph is available
try:
    from langgraph.graph import StateGraph, END
    HAS_LANGGRAPH = True
except ImportError:
    HAS_LANGGRAPH = False

interaction_node = InteractionAgent()
evidence_node = EvidenceAgent()
fraud_node = FraudAgent()
policy_node = PolicyAgent()
resolution_node = ResolutionAgent()
workflow_node = WorkflowAgent()
escalation_node = EscalationAgent()
learning_node = LearningAgent()

class FallbackStateGraph:
    """Lightweight StateGraph workflow runner for hackathon demo compatibility."""
    def __init__(self):
        self.nodes = {
            "interaction": interaction_node,
            "evidence": evidence_node,
            "fraud": fraud_node,
            "policy": policy_node,
            "resolution": resolution_node,
            "workflow": workflow_node,
            "escalation": escalation_node,
            "learning": learning_node,
        }

    async def ainvoke(self, state: dict) -> dict:
        # Step 1: Interaction
        state = await self.nodes["interaction"].execute(state)
        # Step 2: Evidence
        state = await self.nodes["evidence"].execute(state)
        # Step 3: Fraud
        state = await self.nodes["fraud"].execute(state)
        
        # Fraud conditional routing
        fraud_score = state.get("fraud_score", 0.0)
        if fraud_score > 0.60:
            state = await self.nodes["escalation"].execute(state)
            state = await self.nodes["learning"].execute(state)
            return state
            
        # Step 4: Policy RAG
        state = await self.nodes["policy"].execute(state)
        # Step 5: Resolution Strategy
        state = await self.nodes["resolution"].execute(state)
        
        # Resolution conditional routing
        action = state.get("resolution_action", "")
        if action == "Escalate" or state.get("confidence", 1.0) < 0.80:
            state = await self.nodes["escalation"].execute(state)
        else:
            state = await self.nodes["workflow"].execute(state)
            
        # Step 8: Learning
        state = await self.nodes["learning"].execute(state)
        return state

if HAS_LANGGRAPH:
    workflow = StateGraph(ComplaintState)
    workflow.add_node("interaction", interaction_node.execute)
    workflow.add_node("evidence", evidence_node.execute)
    workflow.add_node("fraud", fraud_node.execute)
    workflow.add_node("policy", policy_node.execute)
    workflow.add_node("resolution", resolution_node.execute)
    workflow.add_node("workflow", workflow_node.execute)
    workflow.add_node("escalation", escalation_node.execute)
    workflow.add_node("learning", learning_node.execute)

    workflow.set_entry_point("interaction")
    workflow.add_edge("interaction", "evidence")
    workflow.add_edge("evidence", "fraud")

    def fraud_router(state: ComplaintState) -> str:
        return "escalation" if state.get("fraud_score", 0.0) > 0.60 else "policy"

    workflow.add_conditional_edges("fraud", fraud_router, {"escalation": "escalation", "policy": "policy"})
    workflow.add_edge("policy", "resolution")

    def resolution_router(state: ComplaintState) -> str:
        return "escalation" if (state.get("resolution_action") == "Escalate" or state.get("confidence", 1.0) < 0.8) else "workflow"

    workflow.add_conditional_edges("resolution", resolution_router, {"escalation": "escalation", "workflow": "workflow"})
    workflow.add_edge("workflow", "learning")
    workflow.add_edge("escalation", "learning")
    workflow.add_edge("learning", END)

    app_graph = workflow.compile()
else:
    app_graph = FallbackStateGraph()
