import logging
import time
from typing import Dict, Any, List
from apps.ai_engine.tools.registry import ToolRegistry
from apps.ai_engine.tools.idempotency import IdempotencyEngine
from apps.backend.app.services.mock_enterprise import (
    MockOrderAPI, MockPaymentAPI, MockInventoryAPI, MockShippingAPI, MockNotificationAPI
)

logger = logging.getLogger("workflow_agent")

class WorkflowExecutionAgent:
    """Workflow Execution Agent: Safely executes authorized enterprise tool actions using idempotency controls."""

    def __init__(self):
        self.name = "WorkflowExecutionAgent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        complaint_id = state.get("complaint_id") or state.get("case_id") or "UNKNOWN"
        order_id = state.get("order_id", "ORD-58493-29")
        email = state.get("customer_email", "sarah.j@example.com")
        amount = float(state.get("claim_amount", 25000.0))
        action = state.get("resolution_action") or state.get("recommended_resolution") or "Replacement"
        action_clean = str(action).lower()

        logger.info(f"[{self.name}] Initiating authorized execution plan for case {complaint_id} ({action})")

        execution_plan = {
            "case_id": complaint_id,
            "resolution": action,
            "status": "RUNNING",
            "actions": []
        }

        executed_actions = []
        action_results = []

        # Step 1: Verify Order
        is_exec, prev = IdempotencyEngine.check_executed(complaint_id, "verify_order")
        if is_exec:
            res_order = prev["result"]
        else:
            res_order = ToolRegistry.invoke_tool(self.name, "verify_order", MockOrderAPI.get_order_details, order_id=order_id)
            IdempotencyEngine.record_success(complaint_id, "verify_order", res_order)
            
        executed_actions.append("Verify Order Details")
        action_results.append({"action": "verify_order", "status": "SUCCESS", "result": res_order})

        # Branch logic: REPLACEMENT vs REFUND
        if "replace" in action_clean or "replacement" in action_clean:
            # Step 2: Reserve Inventory
            is_exec, prev = IdempotencyEngine.check_executed(complaint_id, "reserve_inventory")
            if is_exec:
                inv_res = prev["result"]
            else:
                inv_res = ToolRegistry.invoke_tool(self.name, "reserve_inventory", MockInventoryAPI.reserve_inventory, sku="SKU-LAPTOP-PRO-15", quantity=1)
                IdempotencyEngine.record_success(complaint_id, "reserve_inventory", inv_res)
                
            executed_actions.append("Reserve Warehouse Inventory")
            action_results.append({"action": "reserve_inventory", "status": "SUCCESS", "result": inv_res})

            # Step 3: Create Shipment
            is_exec, prev = IdempotencyEngine.check_executed(complaint_id, "create_shipment")
            if is_exec:
                ship_res = prev["result"]
            else:
                ship_res = ToolRegistry.invoke_tool(self.name, "create_shipment", MockShippingAPI.create_replacement_shipment, order_id=order_id, sku="SKU-LAPTOP-PRO-15", destination_email=email)
                IdempotencyEngine.record_success(complaint_id, "create_shipment", ship_res)
                
            executed_actions.append("Create Dispatch Waybill")
            action_results.append({"action": "create_shipment", "status": "SUCCESS", "result": ship_res})

            # Step 4: Schedule Pickup
            is_exec, prev = IdempotencyEngine.check_executed(complaint_id, "schedule_pickup")
            if is_exec:
                pkp_res = prev["result"]
            else:
                pkp_res = ToolRegistry.invoke_tool(self.name, "schedule_pickup", MockShippingAPI.schedule_pickup, order_id=order_id)
                IdempotencyEngine.record_success(complaint_id, "schedule_pickup", pkp_res)
                
            executed_actions.append("Schedule Logistics Pickup")
            action_results.append({"action": "schedule_pickup", "status": "SUCCESS", "result": pkp_res})

            # Step 5: Send Notification
            notice_res = ToolRegistry.invoke_tool(
                self.name, "send_notification", MockNotificationAPI.send_customer_notice,
                email=email, subject="Replacement Dispatch Confirmation", message=f"Your replacement item (SKU-LAPTOP-PRO-15) is scheduled for dispatch. Waybill: {ship_res['waybill_number']}."
            )
            executed_actions.append("Send Customer Dispatch Notice")
            action_results.append({"action": "send_notification", "status": "SUCCESS", "result": notice_res})

            state["status"] = "Approved"
            summary_log = f"Executed Replacement Workflow. Waybill: {ship_res['waybill_number']} via ExpressLogistics."

        elif "refund" in action_clean:
            # Step 2: Process Refund
            is_exec, prev = IdempotencyEngine.check_executed(complaint_id, "create_refund")
            if is_exec:
                pay_res = prev["result"]
            else:
                pay_res = ToolRegistry.invoke_tool(self.name, "create_refund", MockPaymentAPI.process_refund, order_id=order_id, amount=amount, customer_email=email)
                IdempotencyEngine.record_success(complaint_id, "create_refund", pay_res)
                
            executed_actions.append("Process Cash Refund")
            action_results.append({"action": "create_refund", "status": "SUCCESS", "result": pay_res})

            # Step 3: Send Notification
            notice_res = ToolRegistry.invoke_tool(
                self.name, "send_notification", MockNotificationAPI.send_customer_notice,
                email=email, subject="Refund Confirmation", message=f"Full refund of INR {amount:,.2f} has been posted. Refund ID: {pay_res['refund_id']}."
            )
            executed_actions.append("Send Customer Payment Notice")
            action_results.append({"action": "send_notification", "status": "SUCCESS", "result": notice_res})

            state["status"] = "Approved"
            summary_log = f"Processed Cash Refund of INR {amount:,.2f}. Transaction: {pay_res['refund_id']}."

        else:
            state["status"] = "Rejected"
            summary_log = f"Resolution '{action}' halted or rejected."

        execution_plan["status"] = "SUCCESS"
        execution_plan["actions"] = action_results

        state["execution_plan"] = execution_plan
        state["executed_actions"] = executed_actions
        state["execution_results"] = action_results
        state["execution_status"] = "COMPLETED"
        state["last_active_agent"] = self.name

        duration_ms = int((time.time() - start_time) * 1000)
        trace_entry = {
            "agent": "workflow",
            "agent_name": self.name,
            "status": "completed",
            "action_taken": "Enterprise Workflow Execution",
            "log_details": f"{summary_log} Actions executed: {len(executed_actions)}.",
            "duration_ms": duration_ms,
            "confidence": 0.99
        }

        state.setdefault("agent_logs", []).append(trace_entry)
        state.setdefault("agent_trace", []).append(trace_entry)

        return state

# Backward compatibility alias for legacy imports
WorkflowAgent = WorkflowExecutionAgent
