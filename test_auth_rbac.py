import os
import sys
import subprocess
import time
import urllib.request
import urllib.error
import json

def start_backend():
    print("=== Step 1: Launching FastAPI Backend Server for RBAC Testing ===")
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
    
    # Poll until server is ready
    for _ in range(10):
        time.sleep(1)
        if process.poll() is not None:
            out, _ = process.communicate()
            print("Server process crashed on startup! Output:\n", out)
            sys.exit(1)
        try:
            res = urllib.request.urlopen("http://127.0.0.1:8000/health")
            if res.getcode() == 200:
                print("Backend server is bound and ready for RBAC testing.\n")
                break
        except Exception:
            pass
            
    return process

def run_rbac_tests():
    print("=== Step 2: Executing Security & RBAC Test Suite ===")
    base_url = "http://127.0.0.1:8000"

    # Test 1: Customer Login
    customer_token = None
    try:
        login_payload = {"email": "sarah.j@example.com", "password": "password123"}
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/login",
            data=json.dumps(login_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        customer_token = res["access_token"]
        print(f"[OK] Customer Login verified. Role={res['user']['role']}")
    except Exception as e:
        print(f"[FAIL] Customer login failed: {e}")
        return False

    # Test 2: Admin Login
    admin_token = None
    try:
        login_payload = {"email": "admin@resolve.ai", "password": "password123"}
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/login",
            data=json.dumps(login_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        res = json.loads(urllib.request.urlopen(req).read().decode())
        admin_token = res["access_token"]
        print(f"[OK] Admin Login verified. Role={res['user']['role']}")
    except Exception as e:
        print(f"[FAIL] Admin login failed: {e}")
        return False

    # Test 3: Incorrect password login fails
    try:
        login_payload = {"email": "sarah.j@example.com", "password": "WRONGPASSWORD"}
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/login",
            data=json.dumps(login_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req)
        print("[FAIL] Expected HTTP 401 for wrong password but request succeeded")
        return False
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("[OK] Incorrect password login rejected with HTTP 401")
        else:
            print(f"[FAIL] Incorrect password login returned status {e.code}")
            return False

    # Test 4: /auth/me profile verification
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/me",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        me_res = json.loads(urllib.request.urlopen(req).read().decode())
        print(f"[OK] /auth/me verified for: {me_res['email']} ({me_res['role']})")
    except Exception as e:
        print(f"[FAIL] /auth/me check failed: {e}")
        return False

    # Test 5: Public Registration Privilege Escalation Prevention
    try:
        reg_payload = {
            "email": "hacker@example.com",
            "password": "password123",
            "full_name": "Hacker User",
            "role": "ADMIN"  # Attempt to escalate role to ADMIN
        }
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/register",
            data=json.dumps(reg_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        reg_res = json.loads(urllib.request.urlopen(req).read().decode())
        if reg_res["role"] == "CUSTOMER":
            print("[OK] Privilege escalation attempt prevented! Public registration role forced to CUSTOMER.")
        else:
            print(f"[FAIL] Privilege escalation succeeded! User registered as {reg_res['role']}")
            return False
    except Exception as e:
        print(f"[FAIL] Register test failed: {e}")
        return False

    # Test 6: Customer accessing Admin User Management is rejected with HTTP 403
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/admin/users",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        urllib.request.urlopen(req)
        print("[FAIL] Expected HTTP 403 Forbidden for Customer accessing Admin users, but succeeded")
        return False
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print("[OK] Customer access to Admin endpoint blocked with HTTP 403 Forbidden")
        else:
            print(f"[FAIL] Customer access to Admin endpoint returned status {e.code}")
            return False

    # Test 7: Admin accessing Admin User Management succeeds
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/admin/users",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        users = json.loads(urllib.request.urlopen(req).read().decode())
        print(f"[OK] Admin access to User Management verified. User count: {len(users)}")
    except Exception as e:
        print(f"[FAIL] Admin user listing failed: {e}")
        return False

    # Test 8: Resource ownership check (IDOR Protection)
    # DISP-9842 belongs to sarah.j@example.com
    # Customer customer@example.com (Sarah Jenkins) should access it.
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        case_res = json.loads(urllib.request.urlopen(req).read().decode())
        print(f"[OK] Owner Customer accessing own case DISP-9842 succeeded.")
    except Exception as e:
        print(f"[FAIL] Owner accessing own case failed: {e}")
        return False

    # Login as hacker customer and attempt to view Sarah's case DISP-9842
    try:
        login_payload = {"email": "hacker@example.com", "password": "password123"}
        req = urllib.request.Request(
            f"{base_url}/api/v1/auth/login",
            data=json.dumps(login_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        hacker_res = json.loads(urllib.request.urlopen(req).read().decode())
        hacker_token = hacker_res["access_token"]

        # Hacker tries accessing DISP-9842
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-9842",
            headers={'Authorization': f'Bearer {hacker_token}'}
        )
        urllib.request.urlopen(req)
        print("[FAIL] IDOR Vulnerability: Hacker was able to view Sarah's dispute case!")
        return False
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print("[OK] IDOR Protection verified: Hacker blocked with HTTP 403 when requesting Sarah's case.")
        else:
            print(f"[FAIL] IDOR test returned unexpected status {e.code}")
            return False

    return True

if __name__ == "__main__":
    subprocess.check_call([sys.executable, "seed_demo.py"])
    proc = start_backend()
    try:
        res = run_rbac_tests()
        if res:
            print("\n=================================================")
            print(" SECURITY & RBAC AUTHORIZATION TESTS PASSED!     ")
            print("=================================================")
            sys.exit(0)
        else:
            sys.exit(1)
    finally:
        proc.terminate()
        proc.wait()
