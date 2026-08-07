import sys
import os
import io

# Add root directory to sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "apps", "backend")))

from fastapi.testclient import TestClient
from apps.backend.app.main import app

client = TestClient(app)

def test_full_functional_mvp():
    print("==========================================")
    print("   RUNNING FUNCTIONAL MVP BACKEND TESTS   ")
    print("==========================================")

    # 1. Test Real File Upload Endpoint
    print("\n[1] Testing Real Image Upload (/api/v1/disputes/upload)...")
    fake_image_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    
    upload_res = client.post(
        "/api/v1/disputes/upload",
        files={"file": ("test_damage_evidence.png", io.BytesIO(fake_image_bytes), "image/png")}
    )
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    assert upload_data["success"] is True
    file_url = upload_data["file_url"]
    print(f"[OK] Upload successful! File URL: {file_url}")

    # Test static serving of uploaded image
    static_res = client.get(file_url)
    assert static_res.status_code == 200, f"Static serving failed: {static_res.status_code}"
    print(f"[OK] Static file serving verified at {file_url}")

    # Test invalid file type rejection
    bad_upload = client.post(
        "/api/v1/disputes/upload",
        files={"file": ("script.exe", io.BytesIO(b"malicious"), "application/x-msdownload")}
    )
    assert bad_upload.status_code == 400
    print("[OK] Invalid file type correctly rejected with 400 Bad Request")

    # 2. Test Low Risk Dispute Creation
    print("\n[2] Testing Low Risk Dispute Creation (/api/v1/disputes)...")
    low_risk_payload = {
        "title": "Cracked Display on Smartphone",
        "order_id": "ORD-58493-29",
        "category": "Damaged Product",
        "claim_amount": 150.00,
        "complaint_text": "Smartphone screen arrived shattered upon opening package.",
        "evidence_urls": [file_url],
        "customer_name": "Sarah Jenkins"
    }
    low_res = client.post("/api/v1/disputes", json=low_risk_payload)
    assert low_res.status_code == 201, f"Creation failed: {low_res.text}"
    low_data = low_res.json()
    disp_id_low = low_data["id"]
    print(f"[OK] Dispute created: ID={disp_id_low}, Status={low_data['status']}, Resolution={low_data['resolution_action']}")
    assert low_data["status"] in ["RESOLVED", "Approved"]
    assert low_data["resolution_action"] in ["Replacement", "Refund"]

    # 3. Test High Risk Dispute Creation (WAITING_FOR_ADMIN)
    print("\n[3] Testing High Risk Dispute Creation (WAITING_FOR_ADMIN)...")
    high_risk_payload = {
        "title": "High Value Workstation Claim",
        "order_id": "ORD-98204-11",
        "category": "Damaged Product",
        "claim_amount": 75000.00, # Triggers high value threshold
        "complaint_text": "High value server rack damaged in transit.",
        "evidence_urls": [file_url],
        "customer_name": "Alex Rivera"
    }
    high_res = client.post("/api/v1/disputes", json=high_risk_payload)
    assert high_res.status_code == 201, f"High risk creation failed: {high_res.text}"
    high_data = high_res.json()
    disp_id_high = high_data["id"]
    print(f"[OK] High risk dispute created: ID={disp_id_high}, Status={high_data['status']}")
    assert high_data["status"] == "WAITING_FOR_ADMIN"

    # 4. Test Timeline Endpoint
    print("\n[4] Testing Timeline Endpoint (/api/v1/disputes/{id}/timeline)...")
    timeline_res = client.get(f"/api/v1/disputes/{disp_id_high}/timeline")
    assert timeline_res.status_code == 200
    timeline_data = timeline_res.json()
    events = timeline_data["events"]
    assert len(events) >= 3
    print(f"[OK] Timeline returned {len(events)} events for case {disp_id_high}")
    for evt in events:
        print(f"   • [{evt['timestamp'][:19]}] [{evt['agent_name']}] {evt['event_type']} -> {evt['log_details']}")

    # 5. Test Admin Approval
    print("\n[5] Testing Admin Approval (/api/v1/disputes/{id}/approve)...")
    app_res = client.post(f"/api/v1/disputes/{disp_id_high}/approve")
    assert app_res.status_code == 200, f"Approve failed: {app_res.text}"
    app_data = app_res.json()
    assert app_data["status"] == "Approved"
    print(f"[OK] Admin approval successful: Status updated to '{app_data['status']}', Resolution='{app_data['resolution_action']}'")

    # 6. Test Admin Rejection
    print("\n[6] Testing Admin Rejection (/api/v1/disputes/{id}/reject)...")
    rej_dispute = client.post("/api/v1/disputes", json={
        "title": "Fraudulent Claim",
        "order_id": "ORD-9999",
        "category": "Refund Request",
        "claim_amount": 80000.00,
        "complaint_text": "Item never arrived but carrier confirmed delivery.",
        "evidence_urls": [file_url],
        "customer_name": "Unknown User"
    }).json()
    rej_id = rej_dispute["id"]
    
    rej_res = client.post(f"/api/v1/disputes/{rej_id}/reject")
    assert rej_res.status_code == 200
    rej_data = rej_res.json()
    assert rej_data["status"] == "Rejected"
    print(f"[OK] Admin rejection successful: Status updated to '{rej_data['status']}'")

    # 7. Test Conversational Agentic Chatbot (/api/v1/assistant/chat)
    print("\n[7] Testing Agentic Support Assistant (/api/v1/assistant/chat)...")
    # First obtain user token
    login_res = client.post("/api/v1/auth/login", json={"email": "sarah.j@example.com", "password": "password123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    chat_res = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "My laptop screen arrived cracked for ORD-58493-29. Please resolve this.",
            "evidence_url": file_url
        },
        headers=headers
    )
    assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
    chat_data = chat_res.json()
    assert "investigated" in chat_data["message"].lower() or "dispute" in chat_data["message"].lower()
    assert chat_data["dispute"] is not None
    chat_disp_id = chat_data["dispute"]["id"]
    print(f"[OK] Agentic Chatbot successfully created dispute {chat_disp_id} via chat interaction!")
    print(f"   Response message: {chat_data['message']}")

    print("\n==========================================")
    print("   ALL FUNCTIONAL MVP TESTS PASSED 100%!   ")
    print("==========================================")

if __name__ == "__main__":
    test_full_functional_mvp()
