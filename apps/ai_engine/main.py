import sys
import os
import asyncio
import logging

# Ensure root paths are in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "libs")))

from graph.definition import app_graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_engine_main")

async def test_run():
    logger.info("Executing LangGraph test run for Scenario 1 (Damaged Phone)...")
    initial_state = {
        "complaint_id": "DISP-9842",
        "customer_name": "Sarah Jenkins",
        "customer_email": "sarah.j@example.com",
        "customer_history_count": 0,
        "complaint_text": "My smartphone screen arrived cracked and shattered upon opening.",
        "category": "Damaged Product",
        "claim_amount": 899.99,
        "evidence_urls": ["cracked_screen.png"],
        "status": "New",
        "agent_logs": []
    }
    
    final_state = await app_graph.ainvoke(initial_state)
    logger.info("=========================================")
    logger.info(f"Final Dispute Status: {final_state.get('status')}")
    logger.info(f"Fraud Score: {final_state.get('fraud_score')} ({final_state.get('fraud_risk_level')})")
    logger.info(f"Policy Clause: {final_state.get('policy_reference')}")
    logger.info(f"Resolution Action: {final_state.get('resolution_action')}")
    logger.info(f"Confidence Score: {int(final_state.get('confidence', 0)*100)}%")
    logger.info(f"Resolution Reason: {final_state.get('resolution_reason')}")
    logger.info(f"Agent Logs Executed: {len(final_state.get('agent_logs', []))} agents completed.")
    logger.info("=========================================")

if __name__ == "__main__":
    asyncio.run(test_run())
