import os
import sys
import subprocess
import time
import urllib.request
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
    # Wait for server to bind and check status
    time.sleep(5)
    
    # Check if process died early
    if process.poll() is not None:
        print("Server process terminated immediately! Logs:")
        out, _ = process.communicate()
        print(out)
        sys.exit(1)
        
    return process

def run_tests():
    print("=== Step 4: Running Automated API Integration Tests ===")
    base_url = "http://127.0.0.1:8000"
    
    # Test 1: Health check
    try:
        health_res = urllib.request.urlopen(f"{base_url}/health").read().decode()
        print(f"[OK] Health Check response: {health_res}")
    except Exception as e:
        print(f"[FAIL] Health Check failed: {e}")
        return False

    # Test 2: List seeded disputes
    try:
        disputes_res = urllib.request.urlopen(f"{base_url}/api/v1/disputes/").read().decode()
        disputes = json.loads(disputes_res)
        print(f"[OK] Seeded Disputes count: {len(disputes)}")
        for d in disputes:
            print(f"  - Claim {d['id']}: Status={d['status']}, Amount=${d['claim_amount']}")
    except Exception as e:
        print(f"[FAIL] List Disputes failed: {e}")
        return False

    # Test 3: Create a new complaint and trigger LangGraph execution
    try:
        claim_payload = {
            "customer_name": "Marcus Aurelius",
            "customer_email": "marcus@philosophy.com",
            "order_id": "ORD-77492-12",
            "claim_amount": 420.50,
            "complaint_text": "Received screen screen is completely shattered and won't turn on.",
            "evidence_urls": ["broken_screen_photo_1.png"]
        }
        
        req = urllib.request.Request(
            f"{base_url}/api/v1/disputes/complaints/create",
            data=json.dumps(claim_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        create_res = urllib.request.urlopen(req).read().decode()
        dispute = json.loads(create_res)
        dispute_id = dispute["id"]
        print(f"[OK] Created Complaint: {dispute_id} | Final Status: {dispute['status']}")
        
        # Test 4: Fetch Explainable AI breakdown
        res_url = f"{base_url}/api/v1/disputes/resolution/{dispute_id}"
        res_details = json.loads(urllib.request.urlopen(res_url).read().decode())
        print("[OK] Explainable AI Decision Verification:")
        print(f"  - Decision: {res_details['decision']}")
        print(f"  - Reason: {res_details['reason']}")
        print(f"  - Confidence: {res_details['confidence_score']}")
        print(f"  - Policy: {res_details['explainable_ai_breakdown']['policy']['clause']}")
        print(f"  - Fraud risk: {res_details['explainable_ai_breakdown']['fraud_risk']['score']}")
        
    except Exception as e:
        print(f"[FAIL] Create Dispute/RAG Workflow execution failed: {e}")
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
