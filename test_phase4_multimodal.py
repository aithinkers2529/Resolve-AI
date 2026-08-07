import os
import sys
import subprocess
import time
import urllib.request
import urllib.error
import json

def start_backend():
    print("=== Step 1: Launching FastAPI Backend Server for Phase 4 Multimodal Testing ===")
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
                print("Backend server is bound and ready for Phase 4 Multimodal testing.\n")
                break
        except Exception:
            pass
            
    return process

def run_multimodal_tests():
    print("=== Step 2: Executing Multimodal Evidence & Policy RAG Tests ===")
    base_url = "http://127.0.0.1:8000"

    # Authenticate as Admin & Customer to obtain JWT tokens
    admin_token = None
    customer_token = None
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/login",
            data=json.dumps({"email": "admin@resolve.ai", "password": "password123"}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        admin_token = res["access_token"]
        
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/login",
            data=json.dumps({"email": "sarah.j@example.com", "password": "password123"}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        customer_token = res["access_token"]
        print("[OK] Authenticated JWT tokens issued.")
    except Exception as e:
        print(f"[FAIL] Authentication login failed: {e}")
        return False

    # Test 1: Scenario A — Damaged Product (DISP-9842) Evidence Correlation & Auto-Approval
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842/investigate",
            data=json.dumps({}).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {customer_token}'
            }
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        if res["status"] == "Approved" and res["resolution_action"] == "Replacement":
            print(f"[OK] Scenario A Multimodal Investigation Verified: Auto-Approved Replacement for DISP-9842.")
        else:
            print(f"[FAIL] Scenario A returned status={res['status']}")
            return False
    except Exception as e:
        print(f"[FAIL] Scenario A investigation failed: {e}")
        return False

    # Test 2: Verify Scenario A Evidence Analysis API
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842/evidence-analysis",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        ev_analysis = json.loads(urllib.request.urlopen(req).read().decode())
        if ev_analysis["consistency_status"] in ["CONSISTENT", "MOSTLY_CONSISTENT"] and ev_analysis["consistency_score"] >= 0.80:
            print(f"[OK] Evidence Correlation API Verified for DISP-9842: Status={ev_analysis['consistency_status']} ({ev_analysis['consistency_score'] * 100}%)")
        else:
            print(f"[FAIL] Evidence correlation API returned: {ev_analysis}")
            return False
    except Exception as e:
        print(f"[FAIL] Evidence analysis API test failed: {e}")
        return False

    # Test 3: Verify Scenario A Policy Citations API
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842/policies",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        policies = json.loads(urllib.request.urlopen(req).read().decode())
        if len(policies["policy_citations"]) >= 1:
            print(f"[OK] Policy RAG Citations API Verified for DISP-9842: Cited {policies['primary_policy']}")
        else:
            print(f"[FAIL] Policy citations API returned: {policies}")
            return False
    except Exception as e:
        print(f"[FAIL] Policy citations API test failed: {e}")
        return False

    # Test 4: Scenario C — High-Value Policy Conflict Escalation (DISP-9845: INR 75,000 claim)
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9845/investigate",
            data=json.dumps({}).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {admin_token}'
            }
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        if res["status"] == "Requires_Review" and res["human_approval_required"]:
            print(f"[OK] Scenario C Verified: High-Value Policy Conflict (INR 75,000 >= 50,000) correctly halted execution for Manager Verification.")
        else:
            print(f"[FAIL] Scenario C did not halt execution! Status={res['status']}")
            return False
    except Exception as e:
        print(f"[FAIL] Scenario C investigation failed: {e}")
        return False

    # Test 5: Verify Scenario C Policy Conflict Detection API
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9845/policies",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        policies = json.loads(urllib.request.urlopen(req).read().decode())
        if len(policies["conflicts"]) >= 1 and policies["manual_review_required"]:
            print(f"[OK] Policy Conflict Engine Verified for DISP-9845: Conflicts={policies['conflicts']}")
        else:
            print(f"[FAIL] Policy conflict detection failed: {policies}")
            return False
    except Exception as e:
        print(f"[FAIL] Policy conflict API test failed: {e}")
        return False

    # Test 6: Verify Scenario C Decision Passport
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9845/decision-passport",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        passport = json.loads(urllib.request.urlopen(req).read().decode())
        if passport["facts"]["order_verified"] and len(passport["explanation"]) >= 4:
            print(f"[OK] Multimodal Decision Passport Verified: Generated {len(passport['explanation'])} fact-grounded explanation points.")
        else:
            print(f"[FAIL] Decision passport test failed: {passport}")
            return False
    except Exception as e:
        print(f"[FAIL] Multimodal decision passport API test failed: {e}")
        return False

    return True

if __name__ == "__main__":
    subprocess.check_call([sys.executable, "seed_demo.py"])
    proc = start_backend()
    try:
        res = run_multimodal_tests()
        if res:
            print("\n=================================================")
            print(" PHASE 4 MULTIMODAL & POLICY RAG TESTS PASSED!  ")
            print("=================================================")
            sys.exit(0)
        else:
            sys.exit(1)
    finally:
        proc.terminate()
        proc.wait()
