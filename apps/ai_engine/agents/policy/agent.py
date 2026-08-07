from knowledge.rag_pipeline import RAGPipeline
import logging

logger = logging.getLogger("policy_agent")

class PolicyAgent:
    def __init__(self):
        self.name = "Policy Intelligence Agent"
        self.rag = RAGPipeline()

    async def execute(self, state: dict) -> dict:
        logger.info(f"[{self.name}] Querying policy RAG vector store for dispute: {state.get('complaint_id')}")
        
        category = state.get("category", "")
        text = state.get("complaint_text", "")
        history_count = state.get("customer_history_count", 0)
        
        policy_result = self.rag.retrieve_policy(category, text, history_count)
        
        state["policy_eligible"] = policy_result["eligible"]
        state["policy_reference"] = policy_result["policy_reference"]
        state["policy_notes"] = policy_result["policy_notes"]
        state["last_active_agent"] = self.name
        
        log_entry = {
            "agent_name": self.name,
            "action_taken": "RAG Vector Policy Retrieval",
            "log_details": f"Matched Policy Clause: '{policy_result['policy_reference']}'. Eligibility: {policy_result['eligible']}."
        }
        state.setdefault("agent_logs", []).append(log_entry)
        
        return state
