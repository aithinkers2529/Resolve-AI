from .state import ComplaintState
from .routing import route_after_investigation

# Import Agents
from agents.coordinator.agent import CoordinatorAgent
from agents.evidence.agent import EvidenceAgent
from agents.policy.agent import PolicyAgent
from agents.fraud.agent import FraudAgent
from agents.resolution.agent import ResolutionAgent
from agents.workflow.agent import WorkflowAgent
from agents.escalation.agent import EscalationAgent
from agents.learning.agent import LearningAgent

try:
    from langgraph.graph import StateGraph, END
    HAS_LANGGRAPH = True
except ImportError:
    HAS_LANGGRAPH = False

coordinator_node = CoordinatorAgent()
evidence_node = EvidenceAgent()
policy_node = PolicyAgent()
fraud_node = FraudAgent()
resolution_node = ResolutionAgent()
workflow_node = WorkflowAgent()
escalation_node = EscalationAgent()
learning_node = LearningAgent()

class FallbackStateGraph:
    """Deterministic Multi-Agent StateMachine Runner."""
    def __init__(self):
        self.nodes = {
            "coordinator": coordinator_node,
            "evidence": evidence_node,
            "policy": policy_node,
            "fraud": fraud_node,
            "resolution": resolution_node,
            "workflow": workflow_node,
            "escalation": escalation_node,
            "learning": learning_node,
        }

    async def ainvoke(self, state: dict) -> dict:
        try:
            # 1. Coordinator plan generation
            state = await self.nodes["coordinator"].execute(state)
            
            # 2. Evidence analysis
            state = await self.nodes["evidence"].execute(state)
            
            # 3. Policy RAG lookup
            state = await self.nodes["policy"].execute(state)
            
            # 4. Multi-signal Fraud detection
            state = await self.nodes["fraud"].execute(state)
            
            # 5. Resolution strategy synthesis
            state = await self.nodes["resolution"].execute(state)
            
            # 6. Deterministic Risk Engine evaluation
            next_step = route_after_investigation(state)
            if next_step == "workflow":
                state = await self.nodes["workflow"].execute(state)
            else:
                state = await self.nodes["escalation"].execute(state)
                
            # 7. Learning / Audit recording
            state = await self.nodes["learning"].execute(state)
            return state
        except Exception as e:
            # Graceful failure handling: Escalate on exception
            state["status"] = "Requires_Review"
            state["human_approval_required"] = True
            state.setdefault("agent_trace", []).append({
                "agent": "system",
                "status": "failed",
                "log_details": f"Graph execution error: {str(e)}",
                "duration_ms": 0,
                "confidence": 0.0
            })
            return state

if HAS_LANGGRAPH:
    workflow = StateGraph(ComplaintState)
    workflow.add_node("coordinator", coordinator_node.execute)
    workflow.add_node("evidence", evidence_node.execute)
    workflow.add_node("policy", policy_node.execute)
    workflow.add_node("fraud", fraud_node.execute)
    workflow.add_node("resolution", resolution_node.execute)
    workflow.add_node("workflow", workflow_node.execute)
    workflow.add_node("escalation", escalation_node.execute)
    workflow.add_node("learning", learning_node.execute)

    workflow.set_entry_point("coordinator")
    workflow.add_edge("coordinator", "evidence")
    workflow.add_edge("evidence", "policy")
    workflow.add_edge("policy", "fraud")
    workflow.add_edge("fraud", "resolution")

    workflow.add_conditional_edges("resolution", route_after_investigation, {
        "workflow": "workflow",
        "escalation": "escalation"
    })
    
    workflow.add_edge("workflow", "learning")
    workflow.add_edge("escalation", "learning")
    workflow.add_edge("learning", END)

    app_graph = workflow.compile()
else:
    app_graph = FallbackStateGraph()
