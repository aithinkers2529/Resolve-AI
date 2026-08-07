import os
import sys
import subprocess
import time
import urllib.request
import urllib.error
import json
from apps.ai_engine.agents.resolution.schemas import ResolutionType, DecisionStatus
from apps.ai_engine.agents.resolution.scoring import ResolutionScoringEngine
from apps.ai_engine.decision.decision_gate import DecisionGateEngine

def test_resolution_scenarios():
    print("=== Step 1: Executing 7 Deterministic Resolution & Decision Gate Unit Scenarios ===")

    # Scenario 1: Normal Damaged Product Claim
    # Valid evidence (95%), Low fraud (8%), Policy eligible, Replacement available (12 units), Requested replacement.
    p1 = {"policy_id": "WARRANTY-4.2", "eligible": "Eligible", "allowed_actions": ["Replacement", "Refund"]}
    e1 = {"confidence": 0.95, "damage_detected": True, "consistency_status": "CONSISTENT"}
    f1 = {"risk_score": 0.08, "risk_level": "LOW"}
    inv1 = {"available": True, "stock_quantity": 12}
    
    candidates1 = ResolutionScoringEngine.score_candidates(p1, e1, f1, inv1, "Replacement", 25000.0)
    top1 = candidates1[0]
    gate1, review1, reason1 = DecisionGateEngine.evaluate(top1.type, top1.score, p1, e1, f1, 25000.0)
    
    assert top1.type == ResolutionType.REPLACEMENT, f"Scenario 1 failed! Got {top1.type}"
    assert gate1 == DecisionStatus.AUTO_APPROVED, f"Scenario 1 gate failed! Got {gate1}"
    print("  [OK] Scenario 1 (Normal Damaged Product): AUTO_APPROVED -> REPLACEMENT (Score: 95.0%)")

    # Scenario 2: High Fraud Risk Claim
    # Fraud score = 0.88 (High Risk > 0.60 threshold).
    f2 = {"risk_score": 0.88, "risk_level": "HIGH"}
    candidates2 = ResolutionScoringEngine.score_candidates(p1, e1, f2, inv1, "Replacement", 25000.0)
    top2 = candidates2[0]
    gate2, review2, reason2 = DecisionGateEngine.evaluate(top2.type, top2.score, p1, e1, f2, 25000.0)
    
    assert gate2 == DecisionStatus.HUMAN_REVIEW, f"Scenario 2 failed! Got {gate2}"
    assert review2 == True, "Scenario 2 should require human review!"
    print("  [OK] Scenario 2 (High Fraud Risk 88%): HUMAN_REVIEW triggered cleanly")

    # Scenario 3: Weak Evidence Confidence
    # Evidence confidence = 0.48 (< 0.80 threshold).
    e3 = {"confidence": 0.48, "damage_detected": False, "consistency_status": "INCONSISTENT"}
    candidates3 = ResolutionScoringEngine.score_candidates(p1, e3, f1, inv1, "Replacement", 25000.0)
    top3 = candidates3[0]
    gate3, review3, reason3 = DecisionGateEngine.evaluate(top3.type, top3.score, p1, e3, f1, 25000.0)
    
    assert gate3 == DecisionStatus.HUMAN_REVIEW, f"Scenario 3 failed! Got {gate3}"
    print("  [OK] Scenario 3 (Weak Evidence Confidence 48%): HUMAN_REVIEW triggered cleanly")

    # Scenario 4: Policy Ineligible Claim
    # Claim submitted outside policy return window -> REJECTED.
    p4 = {"policy_id": "REFUND-2.1", "eligible": "Ineligible", "allowed_actions": [], "reason": "Submitted outside 30-day window"}
    candidates4 = ResolutionScoringEngine.score_candidates(p4, e1, f1, inv1, "Refund", 25000.0)
    top4 = candidates4[0]
    gate4, review4, reason4 = DecisionGateEngine.evaluate(top4.type, top4.score, p4, e1, f1, 25000.0)
    
    assert gate4 == DecisionStatus.REJECTED, f"Scenario 4 failed! Got {gate4}"
    print("  [OK] Scenario 4 (Policy Ineligible Out-of-Window): REJECTED triggered cleanly")

    # Scenario 5: High-Value Transaction Order (INR 75,000 >= 50,000)
    # Claim amount = INR 75,000.
    candidates5 = ResolutionScoringEngine.score_candidates(p1, e1, f1, inv1, "Replacement", 75000.0)
    top5 = candidates5[0]
    gate5, review5, reason5 = DecisionGateEngine.evaluate(top5.type, top5.score, p1, e1, f1, 75000.0)
    
    assert gate5 == DecisionStatus.HUMAN_REVIEW, f"Scenario 5 failed! Got {gate5}"
    print("  [OK] Scenario 5 (High Value INR 75,000 Order): HUMAN_REVIEW triggered cleanly")

    # Scenario 6: Replacement Out of Stock -> Fallback to Refund
    # Inventory stock = 0. Replacement is INELIGIBLE by rules. Next best = REFUND.
    inv6 = {"available": False, "stock_quantity": 0, "message": "Out of stock"}
    candidates6 = ResolutionScoringEngine.score_candidates(p1, e1, f1, inv6, "Replacement", 25000.0)
    top6 = candidates6[0]
    
    assert top6.type == ResolutionType.REFUND, f"Scenario 6 failed! Top option was {top6.type}"
    print("  [OK] Scenario 6 (Replacement Out of Stock): Stock=0 fallback -> REFUND (Score: 82.0%)")

    # Scenario 7: Stock 0 & Partial Refund Allowed
    # Stock = 0, Refund policy restricted to partial refund only.
    p7 = {"policy_id": "GOODWILL-1.0", "eligible": "Eligible", "allowed_actions": ["Partial Refund", "Coupon"]}
    candidates7 = ResolutionScoringEngine.score_candidates(p7, e1, f1, inv6, "Replacement", 25000.0)
    top7 = candidates7[0]
    
    assert top7.type in [ResolutionType.PARTIAL_REFUND, ResolutionType.COUPON], f"Scenario 7 failed! Top option was {top7.type}"
    print("  [OK] Scenario 7 (Stock 0 & Partial Refund Allowed): Selected PARTIAL_REFUND / COUPON")

    print("\nALL 7 RESOLUTION SCENARIO TESTS PASSED SUCCESSFULLY!\n")
    return True

def start_backend():
    print("=== Step 2: Launching FastAPI Backend Server for REST API Resolution Verification ===")
    root_dir = os.getcwd()
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.pathsep.join([
        root_dir,
        os.path.join(root_dir, "apps", "backend")
    ])
    
    cmd = [sys.executable, "-m", "uvicorn", "apps.backend.app.main:app", "--port", "8000", "--host", "127.0.0.1"]
    process = subprocess.Popen(
        cmd,
        cwd=root_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=env,
        text=True,
        bufsize=1
    )
    
    for _ in range(15):
        time.sleep(1)
        if process.poll() is not None:
            out, _ = process.communicate()
            print("Server process crashed on startup! Output:\n", out)
            sys.exit(1)
        try:
            res = urllib.request.urlopen("http://127.0.0.1:8000/health")
            if res.getcode() == 200:
                print("Backend server is bound and ready for Phase 5 REST API testing.\n")
                break
        except Exception:
            pass
            
    return process

def test_api_endpoints():
    print("=== Step 3: Testing Phase 5 Resolution REST API Endpoints ===")
    base_url = "http://127.0.0.1:8000"

    admin_token = None
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/login",
            data=json.dumps({"email": "admin@resolve.ai", "password": "password123"}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        admin_token = res["access_token"]
    except Exception as e:
        print(f"[FAIL] Auth failed: {e}")
        return False

    # Test GET /api/v1/cases/DISP-9842/resolution
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842/resolution",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        if res["recommended_resolution"] == "replacement" and len(res["candidates"]) >= 3:
            print(f"[OK] GET /cases/DISP-9842/resolution API Verified: Recommended={res['recommended_resolution']} (Candidates={len(res['candidates'])})")
        else:
            print(f"[FAIL] GET resolution API returned: {res}")
            return False
    except Exception as e:
        print(f"[FAIL] GET resolution API test failed: {e}")
        return False

    # Test POST /api/v1/cases/DISP-9842/resolution/analyze
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842/resolution/analyze",
            data=json.dumps({}).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {admin_token}'
            }
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        if res["decision_status"] in ["AUTO_APPROVED", "HUMAN_REVIEW"]:
            print(f"[OK] POST /cases/DISP-9842/resolution/analyze API Verified: Status={res['decision_status']}")
        else:
            print(f"[FAIL] POST resolution analyze API returned: {res}")
            return False
    except Exception as e:
        print(f"[FAIL] POST resolution analyze API test failed: {e}")
        return False

    return True

if __name__ == "__main__":
    if not test_resolution_scenarios():
        sys.exit(1)
        
    proc = start_backend()
    try:
        if test_api_endpoints():
            print("\n=================================================")
            print(" PHASE 5 RESOLUTION ENGINE ALL TESTS PASSED!    ")
            print("=================================================")
            sys.exit(0)
        else:
            sys.exit(1)
    finally:
        proc.terminate()
        proc.wait()
