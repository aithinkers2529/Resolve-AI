import sys
import os

# Add root directory to sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "libs")))

from libs.db_shared.session import engine, SessionLocal
from libs.db_shared.base import Base
from libs.db_shared.models.user import User
from libs.db_shared.models.dispute import Dispute
from libs.db_shared.models.agent_log import AgentLog

def init_db():
    db_file = "resolve_ai_demo.db"
    if os.path.exists(db_file):
        print(f"Removing old database file {db_file} to refresh schema...")
        try:
            os.remove(db_file)
        except Exception as e:
            print(f"Warning: Could not remove old database file: {e}")
            
    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Reset demo tables cleanly
    print("Resetting demo tables...")
    db.query(AgentLog).delete()
    db.query(Dispute).delete()
    db.query(User).delete()
    db.commit()

    print("Seeding demo users...")
    user_admin = User(
        email="admin@resolve.ai",
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW", # "adminpass"
        full_name="Enterprise Admin",
        role="Admin"
    )
    user_customer = User(
        email="customer@example.com",
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
        full_name="Sarah Jenkins",
        role="Customer"
    )
    db.add(user_admin)
    db.add(user_customer)
    db.commit()

    print("Seeding demo dispute scenarios...")
    
    # Scenario 1: Damaged Phone (Auto-Approved Replacement)
    d1 = Dispute(
        id="DISP-9842",
        customer_id="CUST-1001",
        customer_name="Sarah Jenkins",
        customer_email="sarah.j@example.com",
        order_id="ORD-58493-29",
        category="Damaged Product",
        claim_amount=899.99,
        complaint_text="My smartphone screen arrived cracked and shattered upon unboxing the package.",
        status="Approved",
        fraud_score=0.08,
        fraud_risk_level="Low",
        fraud_reasons=["Account clean", "No previous claims", "Shipping weight verified"],
        policy_eligible="Eligible",
        policy_reference="Refund Policy Section 4.2 - Damaged In Transit Coverage",
        policy_notes="Claim submitted within 5 days of delivery. Photos confirm physical impact damage consistent with shipping handling.",
        evidence_urls=["invoice_9842.pdf", "cracked_phone_photo.png"],
        evidence_summary={
            "damage_detected": True,
            "document_verified": True,
            "ocr_items": ["Smartphone Model X", "Order Total: $899.99"]
        },
        resolution_action="Replacement",
        resolution_reason="Evidence verifies damage. Claim eligible under Warranty Section 4.2. Low fraud score (8%). Replacement authorized.",
        confidence=0.95,
        customer_history_count=0
    )

    # Scenario 2: Repeat Fraud Attempt (Escalated for Human Review)
    d2 = Dispute(
        id="DISP-9843",
        customer_id="CUST-9902",
        customer_name="Alex Rivera",
        customer_email="alex.fraud@example.com",
        order_id="ORD-98204-11",
        category="Refund Request",
        claim_amount=1450.00,
        complaint_text="Claiming expensive laptop package never arrived, demanding immediate $1,450 cash refund.",
        status="Requires_Review",
        fraud_score=0.88,
        fraud_risk_level="High",
        fraud_reasons=[
            "5 previous refund claims within 30 days",
            "Geolocation signature mismatch",
            "Signed delivery proof verified by carrier"
        ],
        policy_eligible="Ineligible - Audit Required",
        policy_reference="Policy Section 8.1 - High Frequency Claim Audit",
        policy_notes="Automatic approval suspended. Repeated non-receipt claims trigger mandatory human verification.",
        evidence_urls=["delivery_signature.png"],
        evidence_summary={
            "damage_detected": False,
            "document_verified": False,
            "ocr_items": ["Carrier Signee: A. RIVERA"]
        },
        resolution_action="Escalate",
        resolution_reason="High Fraud Score (88%). Suspicious repeat claims detected. Routed to Human Approval Queue.",
        confidence=0.62,
        customer_history_count=5
    )

    # Scenario 3: Wrong Product Delivered (Auto-Approved Refund)
    d3 = Dispute(
        id="DISP-9844",
        customer_id="CUST-3041",
        customer_name="David Chen",
        customer_email="dchen@techcorp.io",
        order_id="ORD-10928-84",
        category="Wrong Product",
        claim_amount=320.00,
        complaint_text="Ordered a titanium mechanical keyboard, but received a plastic membrane keyboard instead.",
        status="Resolved",
        fraud_score=0.04,
        fraud_risk_level="Low",
        fraud_reasons=["Warehouse dispatch log confirms wrong SKU scanned at packing station."],
        policy_eligible="Eligible",
        policy_reference="Exchange Policy Section 2.3 - Fulfillment Error",
        policy_notes="Warehouse scan log confirms SKU error at distribution center #4.",
        evidence_urls=["packing_slip.pdf"],
        evidence_summary={
            "damage_detected": False,
            "document_verified": True,
            "ocr_items": ["Expected SKU: KB-TITAN", "Scanned SKU: KB-PLASTIC"]
        },
        resolution_action="Refund",
        resolution_reason="Fulfillment error verified by warehouse log. Refund processed.",
        confidence=0.98,
        customer_history_count=1
    )

    db.add(d1)
    db.add(d2)
    db.add(d3)
    db.commit()

    # Seed Agent Execution Logs for the UI timeline
    logs = [
        # Logs for d1
        AgentLog(dispute_id="DISP-9842", agent_name="Customer Interaction Agent", action_taken="Intent Classification", log_details="Categorized intent: Damaged Product (98% confidence). Priority: High."),
        AgentLog(dispute_id="DISP-9842", agent_name="Evidence Verification Agent", action_taken="Vision OCR Analysis", log_details="OCR extracted invoice #9842 ($899.99). Image model confirmed screen fracture."),
        AgentLog(dispute_id="DISP-9842", agent_name="Fraud Detection Agent", action_taken="Risk Assessment", log_details="Calculated Fraud Score: 0.08 (Low Risk). Account active for 3 years with 0 past claims."),
        AgentLog(dispute_id="DISP-9842", agent_name="Policy Intelligence Agent", action_taken="RAG Similarity Search", log_details="Matched Policy Section 4.2: 30-Day Damaged Transit Coverage. Status: Eligible."),
        AgentLog(dispute_id="DISP-9842", agent_name="Resolution Strategy Agent", action_taken="Strategy Decision", log_details="Recommended Action: Replacement Approved (Confidence: 95%)."),
        AgentLog(dispute_id="DISP-9842", agent_name="Workflow Execution Agent", action_taken="API Execution", log_details="Triggered ERP Shipping API: Order #REPLACE-9842 dispatched via Express."),

        # Logs for d2
        AgentLog(dispute_id="DISP-9843", agent_name="Customer Interaction Agent", action_taken="Intent Classification", log_details="Categorized intent: Refund Request. Priority: Urgent."),
        AgentLog(dispute_id="DISP-9843", agent_name="Evidence Verification Agent", action_taken="Carrier OCR Check", log_details="OCR extracted carrier proof: Signed by 'A. RIVERA' on 2026-08-05."),
        AgentLog(dispute_id="DISP-9843", agent_name="Fraud Detection Agent", action_taken="Risk Assessment", log_details="FLAGGED: Fraud Score 0.88 (High Risk). 5 refund claims in last 30 days."),
        AgentLog(dispute_id="DISP-9843", agent_name="Policy Intelligence Agent", action_taken="RAG Search", log_details="Matched Policy Section 8.1: Mandatory audit for high claim frequency."),
        AgentLog(dispute_id="DISP-9843", agent_name="Human Approval Agent", action_taken="Escalation Triggered", log_details="Claim halted. Placed in Admin Human Approval Queue.")
    ]

    for log in logs:
        db.add(log)
    
    db.commit()
    db.close()
    print("Database reset & seeding completed successfully!")

if __name__ == "__main__":
    init_db()
