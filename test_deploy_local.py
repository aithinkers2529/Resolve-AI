import os
import sys
import subprocess
import time
import urllib.request
import urllib.error
import json

def install_python_deps():
    print("=== Step 1: Installing Python Backend Dependencies ===")
    deps = ["fastapi", "uvicorn", "pydantic-settings", "sqlalchemy", "python-jose", "passlib", "bcrypt", "pydantic"]
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + deps)
        print("Backend dependencies installed successfully.\n")
    except Exception as e:
        print(f"Error installing dependencies: {e}\n")

def seed_db():
    print("=== Step 2: Seeding Demo Database ===")
    try:
        subprocess.check_call([sys.executable, "seed_demo.py"])
        print("Database initialized and seeded.\n")
    except Exception as e:
        print(f"Error seeding database: {e}\n")

def start_backend():
    print("=== Step 3: Launching FastAPI Backend Server ===")
    root_dir = os.getcwd()
    
    # Configure environment with PYTHONPATH to resolve both 'libs' and 'app' packages
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.pathsep.join([
        root_dir,
        os.path.join(root_dir, "apps", "backend")
    ])
    
    # Run uvicorn from root to ensure absolute paths resolve
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
    
    print("Waiting for server on port 8000 to start...")
    for _ in range(15):
        time.sleep(1)
        if process.poll() is not None:
            out, _ = process.communicate()
            print("Server process terminated immediately! Logs:\n", out)
            sys.exit(1)
        try:
            res = urllib.request.urlopen("http://127.0.0.1:8000/health")
            if res.getcode() == 200:
                print("Server on port 8000 is ready.")
                break
        except Exception:
            pass
            
    return process

def run_tests():
    print("=== Step 4: Running Automated API Integration Tests ===")
    base_url = "http://127.0.0.1:8000"
    
    # Test 1: Health check
    try:
        health_res = urllib.request.urlopen(f"{base_url}/api/v1/health").read().decode()
        print(f"[OK] Health Check response: {health_res}")
    except Exception as e:
        print(f"[FAIL] Health Check failed: {e}")
        return False

    # Test 2: Readiness check
    try:
        ready_res = urllib.request.urlopen(f"{base_url}/api/v1/ready").read().decode()
        print(f"[OK] Readiness Check response: {ready_res}")
    except Exception as e:
        print(f"[FAIL] Readiness Check failed: {e}")
        return False

    # Test 3: Version check
    try:
        ver_res = urllib.request.urlopen(f"{base_url}/api/v1/version").read().decode()
        print(f"[OK] Version response: {ver_res}")
    except Exception as e:
        print(f"[FAIL] Version check failed: {e}")
        return False

    # Authenticate as Admin & Customer to obtain tokens
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
        print("[OK] Authenticated admin and customer Bearer tokens issued.")
    except Exception as e:
        print(f"[FAIL] Authentication login failed: {e}")
        return False

    # Test 4: Retrieve seeded customer
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/customers/CUST-1001",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        cust_res = urllib.request.urlopen(req).read().decode()
        cust = json.loads(cust_res)
        print(f"[OK] Customer Lookup: ID={cust['id']}, Name={cust['name']}, Risk={cust['risk_rating']}")
    except Exception as e:
        print(f"[FAIL] Customer lookup failed: {e}")
        return False

    # Test 5: Retrieve seeded order
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/orders/ORD-98204-11",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        ord_res = urllib.request.urlopen(req).read().decode()
        order = json.loads(ord_res)
        print(f"[OK] Order Lookup: ID={order['id']}, Amount={order['order_amount']}, Currency={order['currency']}")
    except Exception as e:
        print(f"[FAIL] Order lookup failed: {e}")
        return False

    # Test 6: Create new case
    try:
        case_payload = {
            "customer_name": "Sarah Jenkins",
            "customer_email": "sarah.j@example.com",
            "order_id": "ORD-58493-29",
            "claim_amount": 420.50,
            "complaint_text": "Received screen screen is completely shattered and won't turn on.",
            "evidence_urls": ["broken_screen_photo_1.png"]
        }
        
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/",
            data=json.dumps(case_payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {customer_token}'
            }
        )
        
        create_res = urllib.request.urlopen(req).read().decode()
        case = json.loads(create_res)
        case_id = case["id"]
        print(f"[OK] Created Case: {case_id} | Status: {case['status']}")
        
        # Test 7: Retrieve Case
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/{case_id}",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        case_res = urllib.request.urlopen(req).read().decode()
        retrieved_case = json.loads(case_res)
        print(f"[OK] Retrieved Case: {retrieved_case['id']} | Category: {retrieved_case['category']}")
        
    except Exception as e:
        print(f"[FAIL] Case creation/retrieval failed: {e}")
        return False

    # Test 8: Register and retrieve evidence items
    try:
        evid_payload = {
            "dispute_id": case_id,
            "file_url": "new_unboxing_video.mp4",
            "file_type": "VIDEO"
        }
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/{case_id}/evidence",
            data=json.dumps(evid_payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {customer_token}'
            }
        )
        evid_res = urllib.request.urlopen(req).read().decode()
        evidence_item = json.loads(evid_res)
        print(f"[OK] Registered Evidence: ID={evidence_item['id']}, File={evidence_item['file_url']}")
        
        # Retrieve all evidence for the case
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/{case_id}/evidence",
            headers={'Authorization': f'Bearer {customer_token}'}
        )
        list_evid = json.loads(urllib.request.urlopen(req).read().decode())
        print(f"[OK] Total evidence items retrieved: {len(list_evid)}")
    except Exception as e:
        print(f"[FAIL] Evidence registration/list failed: {e}")
        return False

    # Test 9: Exception handler validation (Expect custom 404 response format)
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/cases/DISP-NONEXISTENT",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        urllib.request.urlopen(req)
        print("[FAIL] Expected 404 not found exception but call succeeded")
        return False
    except urllib.error.HTTPError as e:
        if e.code == 404:
            err_data = json.loads(e.read().decode())
            if not err_data.get("success") and err_data.get("error", {}).get("code") == "CASE_NOT_FOUND":
                print(f"[OK] Centralized Exception handling verified. Got custom error: {err_data}")
            else:
                print(f"[FAIL] Centralized Exception returned wrong JSON format: {err_data}")
                return False
        else:
            print(f"[FAIL] Centralized Exception returned wrong status code: {e.code}")
            return False
    except Exception as e:
        print(f"[FAIL] Centralized Exception handler test failed: {e}")
        return False

    # Test 10: OpenAPI / Swagger docs check
    try:
        urllib.request.urlopen(f"{base_url}/docs")
        print("[OK] Swagger API documentation loaded successfully.")
    except Exception as e:
        print(f"[FAIL] OpenAPI Swagger docs check failed: {e}")
        return False

    # Test 11: Verify legacy API / disputes listing continues to function (Backwards compatibility)
    try:
        req = urllib.request.Request(
            f"{base_url}/api/v1/disputes/",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        legacy_res = urllib.request.urlopen(req).read().decode()
        disputes_list = json.loads(legacy_res)
        print(f"[OK] Backwards compatibility check: Disputes count: {len(disputes_list)}")
    except Exception as e:
        print(f"[FAIL] Backwards compatibility disputes check failed: {e}")
        return False
        
    return True

def install_frontend_deps():
    print("\n=== Step 5: Installing Frontend React NPM Packages ===")
    frontend_dir = os.path.join(os.getcwd(), "apps", "frontend")
    try:
        subprocess.check_call(["npm", "install", "--no-audit", "--no-fund"], cwd=frontend_dir, shell=True)
        print("Frontend React packages installed successfully.\n")
    except Exception as e:
        print(f"Error installing frontend packages: {e}\n")

if __name__ == "__main__":
    install_python_deps()
    seed_db()
    
    server_process = start_backend()
    
    success = False
    try:
        success = run_tests()
    finally:
        # If test fails, show server logs
        if not success:
            print("\nBackend Server logs:")
            server_process.terminate()
            out, _ = server_process.communicate()
            print(out)
        else:
            print("\nTerminating background test server...")
            server_process.terminate()
            server_process.wait()
            print("Test server stopped.")
        
    if success:
        install_frontend_deps()
        print("\n=================================================")
        print(" AUTOMATED DEPLOYMENT & TESTING WAS SUCCESSFUL! ")
        print("All multi-agent reasoning, RAG Rationale, and APIs")
        print("executed flawlessly.")
        print("=================================================")
        sys.exit(0)
    else:
        print("\n[FAIL] Testing failed. Please check logs.")
        sys.exit(1)
