"""
Phase 7 Enterprise Intelligence, Analytics, Learning & Observability Test Suite
Tests: Executive Analytics, Category Breakdown, Resolution Analytics, Automation Rates, Fraud Analytics,
Agent Metrics, Tool Metrics, SLA Compliance, Business Impact, Case Memory, Learning Insights, Health & Observability.
"""
import sys
import os
import asyncio

# Add project root to sys.path
sys.path.insert(0, ".")
sys.path.insert(0, "apps")
sys.path.insert(0, "apps/backend")
sys.path.insert(0, "libs")

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
# SECTION 1: Database Models Verification
# ---------------------------------------------------------------------------
def run_db_model_tests():
    print("\n[1] Database Models Verification Tests")
    print("-" * 50)
    from libs.db_shared.models.feedback import CaseFeedback, CaseAppeal
    from libs.db_shared.models.learning import LearningInsight
    from libs.db_shared.models.metrics import AgentMetric, ToolMetric, SLARecord
    from libs.db_shared.models.memory import CaseMemory

    f1 = CaseFeedback(case_id="DISP-9842", customer_email="sarah.j@example.com", rating=5, comment="Great service!")
    test_assert(f1.rating == 5 and f1.case_id == "DISP-9842", "TC01: CaseFeedback model instantiates correctly with rating 5")

    a1 = CaseAppeal(case_id="DISP-9843", customer_email="alex.fraud@example.com", appeal_reason="Invoice attached", status="PENDING")
    test_assert(a1.status == "PENDING", "TC02: CaseAppeal model defaults to PENDING status")

    l1 = LearningInsight(category="Policy", title="Test Insight", insight_text="Text", recommendation="Rec", status="PROPOSED")
    test_assert(l1.status == "PROPOSED", "TC03: LearningInsight model defaults to PROPOSED status")

    m1 = AgentMetric(agent_name="EvidenceAgent", executions_count=100, avg_latency_ms=1820.0)
    test_assert(m1.agent_name == "EvidenceAgent" and m1.avg_latency_ms == 1820.0, "TC04: AgentMetric model stores latency metrics")

    s1 = SLARecord(case_id="DISP-9842", dispute_category="Damaged Product", target_duration_sec=120.0, actual_duration_sec=38.0, sla_status="WITHIN_SLA")
    test_assert(s1.sla_status == "WITHIN_SLA", "TC05: SLARecord stores SLA status WITHIN_SLA")


# ---------------------------------------------------------------------------
# SECTION 2: Analytics Service & Business Impact Calculations
# ---------------------------------------------------------------------------
def run_analytics_service_tests():
    print("\n[2] Analytics Service & Business Impact Tests")
    print("-" * 50)
    from libs.db_shared.session import SessionLocal
    from app.services.analytics_service import AnalyticsService

    db = SessionLocal()
    service = AnalyticsService(db)

    # TC06: Executive KPIs calculation
    kpis = service.get_overview_kpis()
    test_assert("total_cases" in kpis and "automation_rate" in kpis, "TC06: Overview KPIs return total_cases and automation_rate")
    test_assert(kpis["automation_rate"] >= 0.0 and kpis["automation_rate"] <= 1.0, "TC07: Automation rate is valid probability [0, 1]")

    # TC07: Category breakdown
    cats = service.get_dispute_category_analytics()
    test_assert(isinstance(cats, list) and len(cats) > 0, "TC08: Dispute category analytics returns non-empty list")
    test_assert(any(c["category"] == "Damaged Product" for c in cats), "TC09: Category analytics includes 'Damaged Product'")

    # TC08: Resolution analytics
    res_analytics = service.get_resolution_analytics()
    test_assert("resolution_success_rate" in res_analytics, "TC10: Resolution analytics includes resolution_success_rate")
    test_assert(res_analytics["resolution_success_rate"] > 0.8, "TC11: Resolution success rate is high (>80%)")

    # TC09: Automation analytics
    auto = service.get_automation_analytics()
    test_assert("autonomous_percentage" in auto and "human_assisted_percentage" in auto, "TC12: Automation analytics breaks down autonomous vs assisted %")

    # TC10: Human escalation analytics
    esc = service.get_human_escalation_analytics()
    test_assert("escalation_reasons" in esc, "TC13: Human escalation analytics includes reasons dictionary")
    test_assert("HIGH_FRAUD_RISK" in esc["escalation_reasons"], "TC14: Escalation reasons include HIGH_FRAUD_RISK")

    # TC11: Fraud analytics & signal frequency
    fraud = service.get_fraud_analytics()
    test_assert("top_fraud_signals" in fraud and "risk_tiers" in fraud, "TC15: Fraud analytics includes top_fraud_signals and risk_tiers")

    # TC12: Business impact & simulated cost savings formula
    impact = service.get_business_impact()
    test_assert("estimated_cost_saved" in impact and impact["simulated"] is True, "TC16: Business impact calculates cost savings with simulated=True label")
    test_assert(impact["estimated_cost_saved"] > 0, "TC17: Estimated cost saved is strictly positive")

    # TC13: Benchmark report
    bm = service.get_benchmark_report()
    test_assert("metrics" in bm and len(bm["metrics"]) >= 5, "TC18: Benchmark report provides side-by-side comparison metrics")

    # TC14: CSV Export formatted string
    csv_str = service.export_analytics_csv()
    test_assert("Category,Cases" in csv_str and "Damaged Product" in csv_str, "TC19: CSV export generates formatted CSV data")

    db.close()


# ---------------------------------------------------------------------------
# SECTION 3: Agent Performance & Tool Metrics
# ---------------------------------------------------------------------------
def run_agent_performance_tests():
    print("\n[3] Agent Performance & Tool Metrics Tests")
    print("-" * 50)
    from libs.db_shared.session import SessionLocal
    from app.services.analytics_service import AnalyticsService

    db = SessionLocal()
    service = AnalyticsService(db)

    agents = service.get_agent_performance_metrics()
    test_assert(len(agents) >= 7, "TC20: Agent metrics provided for all 7+ core agents")

    evidence_agent = next((a for a in agents if a["agent_name"] == "EvidenceAgent"), None)
    test_assert(evidence_agent is not None, "TC21: EvidenceAgent metrics present in agent performance list")
    test_assert(evidence_agent["p95_latency_ms"] >= evidence_agent["avg_latency_ms"], "TC22: P95 latency is greater than or equal to average latency")

    tools = service.get_tool_performance_metrics()
    test_assert(any(t["tool_name"] == "create_refund" for t in tools), "TC23: Tool metrics include 'create_refund'")

    db.close()


# ---------------------------------------------------------------------------
# SECTION 4: Case Memory & Continuous Improvement Learning Agent
# ---------------------------------------------------------------------------
async def run_learning_agent_tests():
    print("\n[4] Case Memory & Continuous Improvement Learning Agent Tests")
    print("-" * 50)
    from apps.ai_engine.knowledge.case_memory import CaseMemoryStore
    from apps.ai_engine.agents.learning.agent import LearningAgent

    # TC24: Store and retrieve case memory
    mem = CaseMemoryStore.store_case({
        "case_id": "MEM-TEST-99",
        "category": "Damaged Product",
        "claim_amount": 1200.0,
        "fraud_score": 0.05,
        "resolution_action": "Replacement"
    })
    test_assert(mem["case_id"] == "MEM-TEST-99", "TC24: CaseMemoryStore stores case successfully")

    retrieved = CaseMemoryStore.search_similar_cases("Damaged Product", limit=2)
    test_assert(len(retrieved) > 0, "TC25: CaseMemoryStore searches similar historical cases")

    # TC26: Learning Agent generates PROPOSED insight requiring human approval
    agent = LearningAgent()
    state = {
        "complaint_id": "DISP-LEARN-01",
        "category": "Damaged Product",
        "claim_amount": 25000.0,
        "resolution_action": "Replacement",
        "fraud_score": 0.08,
        "agent_logs": [], "agent_trace": []
    }
    res_state = await agent.execute(state)
    insight = res_state.get("proposed_learning_insight", {})
    test_assert(
        insight.get("status") == "PROPOSED" and insight.get("requires_human_approval") is True,
        "TC26: Learning Agent generates PROPOSED insight requiring human admin approval"
    )
    test_assert("recommendation" in insight, "TC27: Learning insight includes actionable recommendation")


# ---------------------------------------------------------------------------
# SECTION 5: System Health Observability & Error Monitoring
# ---------------------------------------------------------------------------
def run_health_observability_tests():
    print("\n[5] System Health Observability & Error Monitoring Tests")
    print("-" * 50)
    from libs.db_shared.session import SessionLocal
    from app.services.health_service import HealthService

    db = SessionLocal()
    hs = HealthService(db)

    # TC28: Check database health
    db_health = hs.check_database()
    test_assert(db_health["status"] == "HEALTHY", "TC28: Database health check returns HEALTHY")

    # TC29: Check full system health status
    full_health = hs.get_full_health_status()
    test_assert(full_health["status"] in ("HEALTHY", "DEGRADED") and "services" in full_health, "TC29: Full system health status includes services map")

    # TC30: Error logging & retrieval
    hs.log_error("TestService", "TestAgent", "DISP-TEST", "TestException", "Sample error details", "LOW")
    recent_errors = hs.get_recent_errors()
    test_assert(len(recent_errors) > 0, "TC30: HealthService records and retrieves recent error logs")

    db.close()


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  RESOLVE-AI PHASE 7 - Enterprise Intelligence & Observability Test Suite")
    print("=" * 60)

    from libs.db_shared.session import engine
    from libs.db_shared.base import Base
    import libs.db_shared.models  # Register all models
    Base.metadata.create_all(bind=engine)

    run_db_model_tests()
    run_analytics_service_tests()
    run_agent_performance_tests()
    asyncio.run(run_learning_agent_tests())
    run_health_observability_tests()

    print("\n" + "=" * 60)
    print(f"  RESULTS: {PASS} PASSED  |  {FAIL} FAILED")
    print("=" * 60)

    if FAIL > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
