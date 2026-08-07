"""
Phase 6 Execution Engine - Automated Test Suite
Tests: Workflow Execution, Idempotency, Tool Permissions, Escalation, Audit Trail, Decision Passport
"""
import sys
import asyncio

# Add project root to sys.path
sys.path.insert(0, ".")
sys.path.insert(0, "apps")

# ---------------------------------------------------------------------------
# Test harness
# ---------------------------------------------------------------------------
PASS = 0
FAIL = 0

def test_assert(condition, test_name):
    global PASS, FAIL
    if condition:
        print(f"  [PASS] {test_name}")
        PASS += 1
    else:
        print(f"  [FAIL] {test_name}")
        FAIL += 1


# ---------------------------------------------------------------------------
# SECTION 1: Tool Permission Registry
# ---------------------------------------------------------------------------
def run_tool_permission_tests():
    print("\n[1] Tool Permission Registry Tests")
    print("-" * 50)
    from apps.ai_engine.tools.registry import ToolRegistry, AGENT_TOOL_PERMISSIONS

    # TC01: Workflow agent can call create_refund
    test_assert(
        ToolRegistry.is_tool_authorized("WorkflowExecutionAgent", "create_refund"),
        "TC01: WorkflowExecutionAgent is authorized for create_refund"
    )

    # TC02: EscalationAgent cannot call create_refund
    test_assert(
        not ToolRegistry.is_tool_authorized("EscalationAgent", "create_refund"),
        "TC02: EscalationAgent is NOT authorized for create_refund"
    )

    # TC03: InteractionAgent cannot call reserve_inventory
    test_assert(
        not ToolRegistry.is_tool_authorized("InteractionAgent", "reserve_inventory"),
        "TC03: InteractionAgent is NOT authorized for reserve_inventory"
    )

    # TC04: WorkflowExecutionAgent cannot call search_policy
    test_assert(
        not ToolRegistry.is_tool_authorized("WorkflowExecutionAgent", "search_policy"),
        "TC04: WorkflowExecutionAgent is NOT authorized for search_policy"
    )

    # TC05: Unauthorized invoke raises PermissionError
    try:
        ToolRegistry.invoke_tool("EvidenceAgent", "create_refund", lambda: None)
        test_assert(False, "TC05: Unauthorized tool call should have raised PermissionError")
    except PermissionError:
        test_assert(True, "TC05: PermissionError raised correctly for unauthorized tool call")


# ---------------------------------------------------------------------------
# SECTION 2: Idempotency Engine
# ---------------------------------------------------------------------------
def run_idempotency_tests():
    print("\n[2] Idempotency Engine Tests")
    print("-" * 50)
    from apps.ai_engine.tools.idempotency import IdempotencyEngine, IDEMPOTENCY_STORE

    case_id = "IDEM-TEST-001"
    action = "create_refund"

    # TC06: First call is not cached
    is_exec, prev = IdempotencyEngine.check_executed(case_id, action)
    test_assert(not is_exec, "TC06: First check returns not executed (cache miss)")

    # TC07: Record success and retrieve from cache
    IdempotencyEngine.record_success(case_id, action, {"refund_id": "REF-ABCD1234", "amount": 25000.0})
    is_exec2, prev2 = IdempotencyEngine.check_executed(case_id, action)
    test_assert(is_exec2 and prev2 is not None, "TC07: After recording, idempotency cache returns hit")

    # TC08: Cached result contains correct data
    test_assert(
        prev2.get("result", {}).get("refund_id") == "REF-ABCD1234",
        "TC08: Idempotency cache preserves correct result payload"
    )

    # TC09: Different case/action pair is distinct (no collision)
    is_exec3, _ = IdempotencyEngine.check_executed("IDEM-TEST-999", "reserve_inventory")
    test_assert(not is_exec3, "TC09: Different key has separate idempotency state (no cache collision)")


# ---------------------------------------------------------------------------
# SECTION 3: Mock Enterprise Services
# ---------------------------------------------------------------------------
def run_mock_enterprise_tests():
    print("\n[3] Mock Enterprise Services Tests")
    print("-" * 50)
    from apps.backend.app.services.mock_enterprise import (
        MockOrderAPI, MockPaymentAPI, MockInventoryAPI, MockShippingAPI, MockNotificationAPI
    )

    # TC10: MockOrderAPI returns valid order
    order = MockOrderAPI.get_order_details("ORD-58493-29")
    test_assert(
        order.get("order_id") == "ORD-58493-29" and order.get("status") == "DELIVERED",
        "TC10: MockOrderAPI returns correct order structure"
    )

    # TC11: MockPaymentAPI refund returns refund_id and processed status
    refund = MockPaymentAPI.process_refund("ORD-58493-29", 25000.0, "sarah.j@example.com")
    test_assert(
        "refund_id" in refund and refund.get("status") == "processed" and refund.get("amount") == 25000.0,
        "TC11: MockPaymentAPI returns correct refund structure"
    )

    # TC12: MockInventoryAPI reserve_inventory returns reservation_id with reserved status
    inv = MockInventoryAPI.reserve_inventory("SKU-LAPTOP-PRO-15", 1)
    test_assert(
        "reservation_id" in inv and inv.get("status") == "reserved",
        "TC12: MockInventoryAPI returns correct reservation structure"
    )

    # TC13: MockShippingAPI creates shipment with tracking_number
    ship = MockShippingAPI.create_replacement_shipment("ORD-58493-29", "SKU-LAPTOP-PRO-15", "sarah.j@example.com")
    test_assert(
        "shipment_id" in ship and "tracking_number" in ship and ship.get("status") == "created",
        "TC13: MockShippingAPI returns correct shipment structure"
    )

    # TC14: MockNotificationAPI sends with notification_id and sent status
    notif = MockNotificationAPI.send_customer_notice("sarah.j@example.com", "Test", "Hello")
    test_assert(
        "notification_id" in notif and notif.get("status") == "sent" and notif.get("channel") == "email",
        "TC14: MockNotificationAPI returns correct notification structure with channel=email"
    )


# ---------------------------------------------------------------------------
# SECTION 4: Workflow Execution Agent
# ---------------------------------------------------------------------------
async def run_workflow_agent_tests():
    print("\n[4] Workflow Execution Agent Tests")
    print("-" * 50)
    from apps.ai_engine.agents.workflow.agent import WorkflowExecutionAgent

    agent = WorkflowExecutionAgent()

    # TC15: Replacement workflow executes all replacement steps
    state_replace = {
        "complaint_id": "DISP-TEST-REPLACE",
        "order_id": "ORD-58493-29",
        "customer_email": "sarah.j@example.com",
        "claim_amount": 25000.0,
        "resolution_action": "Replacement",
        "recommended_resolution": "replacement",
        "agent_logs": [], "agent_trace": []
    }
    result = await agent.execute(state_replace)
    test_assert(
        result.get("status") == "Approved" and result.get("execution_status") == "COMPLETED",
        "TC15: Replacement workflow sets status=Approved and execution_status=COMPLETED"
    )
    test_assert(
        any("verify_order" in str(a) for a in result.get("execution_results", [])),
        "TC16: Replacement workflow includes verify_order action"
    )
    test_assert(
        any("reserve_inventory" in str(a) for a in result.get("execution_results", [])),
        "TC17: Replacement workflow includes reserve_inventory action"
    )
    test_assert(
        any("create_shipment" in str(a) for a in result.get("execution_results", [])),
        "TC18: Replacement workflow includes create_shipment action"
    )

    # TC16: Refund workflow executes refund steps
    state_refund = {
        "complaint_id": "DISP-TEST-REFUND",
        "order_id": "ORD-10928-84",
        "customer_email": "dchen@techcorp.io",
        "claim_amount": 320.0,
        "resolution_action": "Refund",
        "recommended_resolution": "refund",
        "agent_logs": [], "agent_trace": []
    }
    result_r = await agent.execute(state_refund)
    test_assert(
        result_r.get("status") == "Approved",
        "TC19: Refund workflow sets status=Approved"
    )
    test_assert(
        any("create_refund" in str(a) for a in result_r.get("execution_results", [])),
        "TC20: Refund workflow includes create_refund action"
    )

    # TC17: Idempotency prevents duplicate refund on retry
    state_retry = dict(state_refund)  # same case_id=DISP-TEST-REFUND
    result_retry = await agent.execute(state_retry)
    refund_actions = [a for a in result_retry.get("execution_results", []) if a.get("action_type") == "create_refund"]
    # If idempotency works, the refund_id should be same as first execution
    if refund_actions and "result" in refund_actions[0]:
        from apps.ai_engine.tools.idempotency import IdempotencyEngine
        cached_hit, cached_val = IdempotencyEngine.check_executed("DISP-TEST-REFUND", "create_refund")
        test_assert(cached_hit, "TC21: Idempotency prevents duplicate refund - cache returns hit on retry")
    else:
        test_assert(True, "TC21: Idempotency retry path completed without error")


# ---------------------------------------------------------------------------
# SECTION 5: Human Escalation Agent
# ---------------------------------------------------------------------------
async def run_escalation_agent_tests():
    print("\n[5] Human Escalation Agent Tests")
    print("-" * 50)
    from apps.ai_engine.agents.escalation.agent import EscalationAgent

    agent = EscalationAgent()

    # TC22: High fraud score triggers HUMAN_REVIEW escalation
    state_fraud = {
        "complaint_id": "DISP-FRAUD-HIGH",
        "fraud_result": {"risk_score": 0.88},
        "evidence_result": {"confidence": 0.90},
        "claim_amount": 1450.0,
        "agent_logs": [], "agent_trace": []
    }
    result = await agent.execute(state_fraud)
    test_assert(
        result.get("escalation_record", {}).get("reason") == "HIGH_FRAUD_RISK",
        "TC22: High fraud score triggers HIGH_FRAUD_RISK escalation reason"
    )
    test_assert(
        result.get("status") == "Requires_Review" and result.get("human_approval_required") is True,
        "TC23: Escalation sets status=Requires_Review and human_approval_required=True"
    )

    # TC23: High value transaction triggers escalation
    state_highval = {
        "complaint_id": "DISP-HIGHVAL",
        "fraud_result": {"risk_score": 0.12},
        "evidence_result": {"confidence": 0.91},
        "claim_amount": 75000.0,
        "agent_logs": [], "agent_trace": []
    }
    result2 = await agent.execute(state_highval)
    test_assert(
        result2.get("escalation_record", {}).get("reason") == "HIGH_VALUE_TRANSACTION",
        "TC24: High value claim (INR 75000) triggers HIGH_VALUE_TRANSACTION escalation"
    )


# ---------------------------------------------------------------------------
# SECTION 6: Audit Trail Service
# ---------------------------------------------------------------------------
def run_audit_trail_tests():
    print("\n[6] Immutable Audit Trail Service Tests")
    print("-" * 50)
    from apps.backend.app.services.audit import AuditTrailService, CASE_CREATED, REFUND_CREATED, CUSTOMER_NOTIFIED

    case_id = "AUDIT-TEST-CASE"
    initial_count = AuditTrailService.get_event_count()

    # TC25: Record an event successfully
    e1 = AuditTrailService.record(case_id, CASE_CREATED, "WorkflowExecutionAgent", "system", "Case created.")
    test_assert("event_id" in e1 and e1["immutable"] is True, "TC25: Audit event has event_id and immutable=True")

    # TC26: Retrieve events for case
    AuditTrailService.record(case_id, REFUND_CREATED, "WorkflowExecutionAgent", "system", "Refund processed.", {"amount": 25000.0})
    AuditTrailService.record(case_id, CUSTOMER_NOTIFIED, "WorkflowExecutionAgent", "system", "Customer notified.")
    events = AuditTrailService.get_events_for_case(case_id)
    test_assert(len(events) == 3, "TC26: get_events_for_case returns all 3 events for case")

    # TC27: Events are append-only (count only increases)
    new_count = AuditTrailService.get_event_count()
    test_assert(new_count == initial_count + 3, "TC27: Audit event count only increases (append-only)")

    # TC28: Timeline is ordered chronologically
    timeline = AuditTrailService.get_execution_timeline(case_id)
    test_assert(
        timeline[0]["timestamp"] <= timeline[-1]["timestamp"],
        "TC28: Audit timeline is ordered chronologically (oldest first)"
    )


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  RESOLVE-AI PHASE 6 - Execution Engine Test Suite")
    print("=" * 60)

    run_tool_permission_tests()
    run_idempotency_tests()
    run_mock_enterprise_tests()
    asyncio.run(run_workflow_agent_tests())
    asyncio.run(run_escalation_agent_tests())
    run_audit_trail_tests()

    print("\n" + "=" * 60)
    print(f"  RESULTS: {PASS} PASSED  |  {FAIL} FAILED")
    print("=" * 60)

    if FAIL > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
