import os
import sys
import subprocess
import time
import urllib.request
import urllib.error
import json

def start_backend():
    print("=== Step 1: Launching FastAPI Backend Server for Phase 3 Agent Testing ===")
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
                print("Backend server is bound and ready for Phase 3 Agent testing.\n")
                break
        except Exception:
            pass
            
    return process

def run_agent_tests():
    print("=== Step 2: Executing Multi-Agent Dispute Investigation Tests ===")
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

    # Test 1: Scenario A — Damaged Product (DISP-9842) Multi-Agent Investigation
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
            print(f"[OK] Scenario A Verified: Auto-Approved Replacement for DISP-9842. Fraud score={res['fraud_score']}")
        else:
            print(f"[FAIL] Scenario A returned status={res['status']} and action={res['resolution_action']}")
            return False
    except Exception as e:
        print(f"[FAIL] Scenario A investigation failed: {e}")
        return False

    # Test 2: Verify Scenario A Agent Trace
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842/trace",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        trace = json.loads(urllib.request.urlopen(req).read().decode())
        if len(trace) >= 5:
            agents_ran = [t['agent_name'] for t in trace]
            print(f"[OK] Scenario A Trace verified ({len(trace)} steps): {', '.join(agents_ran)}")
        else:
            print(f"[FAIL] Trace returned too few steps: {len(trace)}")
            return False
    except Exception as e:
        print(f"[FAIL] Trace retrieval failed: {e}")
        return False

    # Test 3: Verify Scenario A Decision Passport
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842/decision",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        dec = json.loads(urllib.request.urlopen(req).read().decode())
        if dec["policy_reference"] and dec["recommended_action"] == "Replacement":
            print(f"[OK] Decision Passport verified for DISP-9842: Policy={dec['policy_reference']}")
        else:
            print(f"[FAIL] Decision passport incomplete: {dec}")
            return False
    except Exception as e:
        print(f"[FAIL] Decision passport test failed: {e}")
        return False

    # Test 4: Scenario B — Repeat Fraud Claim (DISP-9843) Escalation to Human Review
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9843/investigate",
            data=json.dumps({}).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {admin_token}'
            }
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        if res["status"] == "Requires_Review" and res["human_approval_required"]:
            print(f"[OK] Scenario B Verified: Halted for Human Review (Fraud score={res['fraud_score'] * 100}%).")
        else:
            print(f"[FAIL] Scenario B did not escalate! Status={res['status']}")
            return False
    except Exception as e:
        print(f"[FAIL] Scenario B investigation failed: {e}")
        return False

    # Test 5: Scenario B Human Approval Resumes Execution
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9843/approve",
            data=json.dumps({}).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {admin_token}'
            }
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        if res["status"] == "Approved" and not res["human_approval_required"]:
            print(f"[OK] Human Approval Endpoint Verified: DISP-9843 state updated to Approved.")
        else:
            print(f"[FAIL] Human approval failed to approve case: {res}")
            return False
    except Exception as e:
        print(f"[FAIL] Human approval test failed: {e}")
        return False

    return True

if __name__ == "__main__":
    subprocess.check_call([sys.executable, "seed_demo.py"])
    proc = start_backend()
    try:
        res = run_agent_tests()
        if res:
            print("\n=================================================")
            print(" PHASE 3 AGENT INVESTIGATION TESTS PASSED!      ")
            print("=================================================")
            sys.exit(0)
        else:
            sys.exit(1)
    finally:
        proc.terminate()
        proc.wait()
