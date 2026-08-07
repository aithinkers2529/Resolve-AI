import sys
import os

# Add root directory to sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "libs")))

from libs.db_shared.session import engine, SessionLocal
from libs.db_shared.base import Base

# Import all models to register with Base
from libs.db_shared.models.user import User
from libs.db_shared.models.dispute import Dispute
from libs.db_shared.models.agent_log import AgentLog
from libs.db_shared.models.customer import Customer
from libs.db_shared.models.product import Product
from libs.db_shared.models.order import Order
from libs.db_shared.models.evidence import EvidenceItem
from libs.db_shared.models.policy import PolicyRule
from libs.db_shared.models.fraud import FraudAssessment
from libs.db_shared.models.resolution import ResolutionRecord
from libs.db_shared.models.agent_run import AgentRun
from libs.db_shared.models.audit import AuditLog

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
    db.query(AuditLog).delete()
    db.query(AgentRun).delete()
    db.query(ResolutionRecord).delete()
    db.query(FraudAssessment).delete()
    db.query(PolicyRule).delete()
    db.query(EvidenceItem).delete()
    db.query(Order).delete()
    db.query(Product).delete()
    db.query(Customer).delete()
    db.query(AgentLog).delete()
    db.query(Dispute).delete()
    db.query(User).delete()
    db.commit()

    print("Seeding demo customers...")
    c1 = Customer(
        id="CUST-1001",
        email="sarah.j@example.com",
        name="Sarah Jenkins",
        phone="+919876543210",
        account_age_days=730,
        total_orders_count=12,
        total_claims_count=0,
        risk_rating="LOW"
    )
    c2 = Customer(
        id="CUST-9902",
        email="alex.fraud@example.com",
        name="Alex Rivera",
        phone="+919876543211",
        account_age_days=45,
        total_orders_count=6,
        total_claims_count=5,
        risk_rating="HIGH"
    )
    c3 = Customer(
        id="CUST-3041",
        email="dchen@techcorp.io",
        name="David Chen",
        phone="+919876543212",
        account_age_days=180,
        total_orders_count=3,
        total_claims_count=1,
        risk_rating="LOW"
    )
    db.add_all([c1, c2, c3])
    db.commit()

    print("Seeding demo products...")
    p1 = Product(
        id="PROD-PHONE",
        sku="PH-MODEL-X",
        name="Smartphone Model X",
        category="Electronics",
        price=899.99,
        warranty_period_days=365
    )
    p2 = Product(
        id="PROD-LAPTOP",
        sku="LAP-DELL-25K",
        name="Luxury Laptop Core i5",
        category="Electronics",
        price=25000.0,
        warranty_period_days=365
    )
    p3 = Product(
        id="PROD-KEYBOARD",
        sku="KB-TITAN",
        name="Titanium Mechanical Keyboard",
        category="Computer Accessories",
        price=320.0,
        warranty_period_days=730
    )
    db.add_all([p1, p2, p3])
    db.commit()

    print("Seeding demo orders...")
    o1 = Order(
        id="ORD-58493-29",
        customer_id="CUST-1001",
        product_id="PROD-PHONE",
        product_name="Smartphone Model X",
        order_amount=899.99,
        status="DELIVERED"
    )
    o2 = Order(
        id="ORD-98204-11",
        customer_id="CUST-9902",
        product_id="PROD-LAPTOP",
        product_name="Luxury Laptop Core i5",
        order_amount=25000.0,
        status="DELIVERED"
    )
    o3 = Order(
        id="ORD-10928-84",
        customer_id="CUST-3041",
        product_id="PROD-KEYBOARD",
        product_name="Titanium Mechanical Keyboard",
        order_amount=320.0,
        status="DELIVERED"
    )
    db.add_all([o1, o2, o3])
    db.commit()

    print("Seeding demo users...")
    demo_users = [
        User(
            email="admin@resolve.ai",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Enterprise Admin",
            role="ADMIN"
        ),
        User(
            email="sarah.j@example.com",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Sarah Jenkins",
            role="CUSTOMER"
        ),
        User(
            email="alex.fraud@example.com",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Alex Rivera",
            role="CUSTOMER"
        ),
        User(
            email="elena.rostova@example.com",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Elena Rostova",
            role="CUSTOMER"
        ),
        User(
            email="customer@resolveai.demo",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Demo Customer",
            role="CUSTOMER"
        ),
        User(
            email="support@resolveai.demo",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Demo Support Agent",
            role="SUPPORT_AGENT"
        ),
        User(
            email="fraud@resolveai.demo",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Demo Fraud Analyst",
            role="FRAUD_ANALYST"
        ),
        User(
            email="policy@resolveai.demo",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Demo Policy Analyst",
            role="POLICY_ANALYST"
        ),
        User(
            email="manager@resolveai.demo",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Demo Resolution Manager",
            role="RESOLUTION_MANAGER"
        ),
        User(
            email="admin@resolveai.demo",
            hashed_password="$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6", # "password123"
            full_name="Demo Admin User",
            role="ADMIN"
        )
    ]
    db.add_all(demo_users)
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
        ocr_text="Smartphone Model X | Order Total: $899.99",
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
        claim_amount=25000.0,  # Updated to match laptop claim
        complaint_text="Claiming expensive laptop package never arrived, demanding immediate INR 25,000 cash refund.",
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
        ocr_text="Carrier Signee: A. RIVERA",
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
        claim_amount=320.0,
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
        ocr_text="Expected SKU: KB-TITAN | Scanned SKU: KB-PLASTIC",
        resolution_action="Refund",
        resolution_reason="Fulfillment error verified by warehouse log. Refund processed.",
        confidence=0.98,
        customer_history_count=1
    )

    # Scenario C: High-Value Transaction Policy Conflict (Escalated due to >INR 50,000 rule)
    d4 = Dispute(
        id="DISP-9845",
        customer_id="CUST-7710",
        customer_name="Elena Rostova",
        customer_email="elena.rostova@example.com",
        order_id="ORD-77109-55",
        category="Damaged Product",
        claim_amount=75000.0,
        complaint_text="My INR 75,000 custom graphics workstation laptop arrived with a crushed chassis and cracked screen.",
        status="Requires_Review",
        fraud_score=0.12,
        fraud_risk_level="Low",
        fraud_reasons=["Account clean", "Corporate buyer verified"],
        policy_eligible="Eligible - Manager Approval Required",
        policy_reference="Policy Section 1.2 - High-Value Verification Constraint",
        policy_notes="Policy Conflict Triggered: Claim amount (INR 75,000 >= 50,000) mandates manual manager verification under Policy HIGHVALUE-1.2.",
        evidence_urls=["workstation_invoice.pdf", "crushed_chassis_photo.png"],
        evidence_summary={
            "damage_detected": True,
            "document_verified": True,
            "consistency_status": "CONSISTENT",
            "ocr_items": ["Workstation Laptop SKU-WORK-99", "Invoice Total: INR 75,000"]
        },
        ocr_text="Workstation Laptop SKU-WORK-99 | Invoice Total: INR 75,000",
        resolution_action="Replacement",
        resolution_reason="Evidence verified (96%). Fraud score clean (12%). High-value policy conflict (INR 75,000 >= 50,000) requires manual manager sign-off.",
        confidence=0.96,
        human_approval_required=True,
        customer_history_count=0
    )

    db.add(d1)
    db.add(d2)
    db.add(d3)
    db.add(d4)
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
