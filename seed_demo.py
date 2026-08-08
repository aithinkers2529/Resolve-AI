import sys
import os
from datetime import datetime, timezone, timedelta

# Add root directory and libs to sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "libs")))

from libs.db_shared.session import engine, SessionLocal
from libs.db_shared.base import Base

# Import all models to register with Base
from libs.db_shared.models.user import User
from libs.db_shared.models.customer import Customer
from libs.db_shared.models.product import Product
from libs.db_shared.models.order import Order
from libs.db_shared.models.dispute import Dispute
from libs.db_shared.models.evidence import EvidenceItem
from libs.db_shared.models.policy import PolicyRule
from libs.db_shared.models.fraud import FraudAssessment
from libs.db_shared.models.resolution import ResolutionRecord
from libs.db_shared.models.agent_log import AgentLog
from libs.db_shared.models.agent_run import AgentRun
from libs.db_shared.models.audit import AuditLog
from libs.db_shared.models.wallet import Wallet, Transaction
from libs.db_shared.models.notification import Notification
from libs.db_shared.models.replacement import ReplacementShipment
from libs.db_shared.models.passport import DecisionPassportModel

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
    
    # 1. Seed Demo Customers
    print("Seeding demo customers...")
    c1 = Customer(
        id="CUST-1001",
        email="sarah.j@example.com",
        name="Sarah Jenkins",
        phone="+91 98765 43210",
        account_age_days=730,
        total_orders_count=12,
        total_claims_count=0,
        risk_rating="LOW"
    )
    c2 = Customer(
        id="CUST-9902",
        email="alex.fraud@example.com",
        name="Alex Rivera",
        phone="+91 98765 43211",
        account_age_days=45,
        total_orders_count=6,
        total_claims_count=5,
        risk_rating="HIGH"
    )
    c3 = Customer(
        id="CUST-3041",
        email="dchen@techcorp.io",
        name="David Chen",
        phone="+91 98765 43212",
        account_age_days=180,
        total_orders_count=8,
        total_claims_count=1,
        risk_rating="LOW"
    )
    c4 = Customer(
        id="CUST-7710",
        email="elena.rostova@example.com",
        name="Elena Rostova",
        phone="+91 98765 43213",
        account_age_days=365,
        total_orders_count=15,
        total_claims_count=0,
        risk_rating="LOW"
    )
    c5 = Customer(
        id="CUST-4421",
        email="marcus.vance@example.com",
        name="Marcus Vance",
        phone="+91 98765 43214",
        account_age_days=90,
        total_orders_count=4,
        total_claims_count=1,
        risk_rating="MEDIUM"
    )
    db.add_all([c1, c2, c3, c4, c5])
    db.commit()

    # 2. Seed Demo Products (10+ realistic catalog products)
    print("Seeding demo products...")
    products = [
        Product(id="PROD-PHONE", sku="PH-MODEL-X", name="Smartphone Model X 256GB", category="Electronics", price=899.99, warranty_period_days=365),
        Product(id="PROD-LAPTOP", sku="LAP-DELL-25K", name="Luxury Laptop Core i5 16GB", category="Electronics", price=25000.0, warranty_period_days=365),
        Product(id="PROD-KEYBOARD", sku="KB-TITAN", name="Titanium Mechanical Gaming Keyboard", category="Computer Accessories", price=320.0, warranty_period_days=730),
        Product(id="PROD-MONITOR", sku="MON-4K-32", name="Ultra HD 4K IPS Monitor 32-inch", category="Electronics", price=18500.0, warranty_period_days=1095),
        Product(id="PROD-HEADPHONES", sku="AUDIO-ANC-PRO", name="Noise-Cancelling Wireless Headphones", category="Audio", price=1499.0, warranty_period_days=365),
        Product(id="PROD-TABLET", sku="TAB-GRAPH-12", name="Pro Stylus Graphics Tablet 12.9-inch", category="Creative Tools", price=8200.0, warranty_period_days=365),
        Product(id="PROD-SMARTWATCH", sku="WATCH-TITAN-GPS", name="Titanium Smart Fitness Watch GPS", category="Wearables", price=2450.0, warranty_period_days=365),
        Product(id="PROD-EARBUDS", sku="BUDS-SPATIAL-5", name="True Wireless Spatial Audio Earbuds", category="Audio", price=799.0, warranty_period_days=180),
        Product(id="PROD-DOCK", sku="DOCK-TB4-DUAL", name="Thunderbolt 4 Dual 4K Docking Station", category="Computer Accessories", price=3800.0, warranty_period_days=730),
        Product(id="PROD-CHAIR", sku="CHAIR-ERGO-X", name="Ergonomic High-Back Executive Mesh Chair", category="Office Furniture", price=12000.0, warranty_period_days=1825),
        Product(id="PROD-WORKSTATION", sku="SKU-WORK-99", name="Custom Graphics Workstation Laptop", category="Electronics", price=75000.0, warranty_period_days=730)
    ]
    db.add_all(products)
    db.commit()

    # 3. Seed Demo Orders (12+ realistic orders)
    print("Seeding demo orders...")
    now = datetime.now(timezone.utc)
    orders = [
        Order(id="ORD-58493-29", customer_id="CUST-1001", product_id="PROD-PHONE", product_name="Smartphone Model X 256GB", order_amount=899.99, status="DELIVERED", delivery_date=now - timedelta(days=2)),
        Order(id="ORD-58493-30", customer_id="CUST-1001", product_id="PROD-HEADPHONES", product_name="Noise-Cancelling Wireless Headphones", order_amount=1499.0, status="DELIVERED", delivery_date=now - timedelta(days=15)),
        Order(id="ORD-58493-31", customer_id="CUST-1001", product_id="PROD-SMARTWATCH", product_name="Titanium Smart Fitness Watch GPS", order_amount=2450.0, status="SHIPPED", delivery_date=now + timedelta(days=1)),
        Order(id="ORD-98204-11", customer_id="CUST-9902", product_id="PROD-LAPTOP", product_name="Luxury Laptop Core i5 16GB", order_amount=25000.0, status="DELIVERED", delivery_date=now - timedelta(days=3)),
        Order(id="ORD-98204-12", customer_id="CUST-9902", product_id="PROD-MONITOR", product_name="Ultra HD 4K IPS Monitor 32-inch", order_amount=18500.0, status="DELIVERED", delivery_date=now - timedelta(days=20)),
        Order(id="ORD-10928-84", customer_id="CUST-3041", product_id="PROD-KEYBOARD", product_name="Titanium Mechanical Gaming Keyboard", order_amount=320.0, status="DELIVERED", delivery_date=now - timedelta(days=1)),
        Order(id="ORD-10928-85", customer_id="CUST-3041", product_id="PROD-DOCK", product_name="Thunderbolt 4 Dual 4K Docking Station", order_amount=3800.0, status="DELIVERED", delivery_date=now - timedelta(days=45)),
        Order(id="ORD-77109-55", customer_id="CUST-7710", product_id="PROD-WORKSTATION", product_name="Custom Graphics Workstation Laptop", order_amount=75000.0, status="DELIVERED", delivery_date=now - timedelta(days=2)),
        Order(id="ORD-77109-56", customer_id="CUST-7710", product_id="PROD-CHAIR", product_name="Ergonomic High-Back Executive Mesh Chair", order_amount=12000.0, status="DELIVERED", delivery_date=now - timedelta(days=30)),
        Order(id="ORD-44210-91", customer_id="CUST-4421", product_id="PROD-TABLET", product_name="Pro Stylus Graphics Tablet 12.9-inch", order_amount=8200.0, status="DELIVERED", delivery_date=now - timedelta(days=4)),
        Order(id="ORD-44210-92", customer_id="CUST-4421", product_id="PROD-EARBUDS", product_name="True Wireless Spatial Audio Earbuds", order_amount=799.0, status="DELIVERED", delivery_date=now - timedelta(days=10))
    ]
    db.add_all(orders)
    db.commit()

    # 4. Seed Demo Users (Auth table)
    print("Seeding demo users...")
    # Password for all demo accounts is "password123"
    hashed_pwd = "$2b$12$gaNUTHaJ0eA4lOCA3alJO.9P5MNg.VNpHNCJTD1KYVaJGTSkTtMJ6"
    demo_users = [
        User(email="admin@resolve.ai", hashed_password=hashed_pwd, full_name="Enterprise Admin", role="ADMIN"),
        User(email="admin@resolveai.demo", hashed_password=hashed_pwd, full_name="Demo Admin User", role="ADMIN"),
        User(email="sarah.j@example.com", hashed_password=hashed_pwd, full_name="Sarah Jenkins", role="CUSTOMER"),
        User(email="alex.fraud@example.com", hashed_password=hashed_pwd, full_name="Alex Rivera", role="CUSTOMER"),
        User(email="dchen@techcorp.io", hashed_password=hashed_pwd, full_name="David Chen", role="CUSTOMER"),
        User(email="elena.rostova@example.com", hashed_password=hashed_pwd, full_name="Elena Rostova", role="CUSTOMER"),
        User(email="marcus.vance@example.com", hashed_password=hashed_pwd, full_name="Marcus Vance", role="CUSTOMER"),
        User(email="customer@resolveai.demo", hashed_password=hashed_pwd, full_name="Demo Customer", role="CUSTOMER")
    ]
    db.add_all(demo_users)
    db.commit()

    # 5. Seed Demo Disputes
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
        status="RESOLVED",
        fraud_score=0.08,
        fraud_risk_level="Low",
        fraud_reasons=["Account clean (2 years active)", "No previous claims recorded", "Shipping weight verified"],
        policy_eligible="Eligible",
        policy_reference="Refund Policy Section 4.2 - Damaged In Transit Coverage",
        policy_notes="Claim submitted within 5 days of delivery. Photos confirm physical impact damage consistent with shipping handling.",
        evidence_urls=["/uploads/broken_screen_photo.png", "/uploads/invoice_9842.pdf"],
        evidence_summary={
            "damage_detected": True,
            "document_verified": True,
            "ocr_items": ["Smartphone Model X 256GB", "Order Total: $899.99", "Serial: SN-9842-X"]
        },
        ocr_text="Smartphone Model X 256GB | Order Total: $899.99 | Serial: SN-9842-X",
        resolution_action="Replacement",
        resolution_reason="Evidence verified (95%). Claim eligible under Warranty Section 4.2. Low fraud risk (8%). Replacement authorized and dispatched.",
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
        claim_amount=25000.0,
        complaint_text="Claiming expensive laptop package never arrived, demanding immediate INR 25,000 cash refund.",
        status="Requires_Review",
        fraud_score=0.88,
        fraud_risk_level="High",
        fraud_reasons=[
            "5 previous refund claims within 30 days",
            "Geolocation IP signature mismatch during delivery window",
            "Signed carrier delivery proof verified with matching signature"
        ],
        policy_eligible="Ineligible - Mandatory Audit Required",
        policy_reference="Policy Section 8.1 - High Frequency Claim Audit",
        policy_notes="Automatic approval suspended. Repeated non-receipt claims trigger mandatory human verification.",
        evidence_urls=["/uploads/delivery_signature.png"],
        evidence_summary={
            "damage_detected": False,
            "document_verified": False,
            "ocr_items": ["Carrier Signee: A. RIVERA", "Delivery Timestamp: 2026-08-05 14:22 UTC"]
        },
        ocr_text="Carrier Signee: A. RIVERA | Delivery Timestamp: 2026-08-05 14:22 UTC",
        resolution_action="Escalate",
        resolution_reason="High Fraud Score (88%). Suspicious repeat claims detected. Routed to Admin Human Approval Queue.",
        confidence=0.62,
        human_approval_required=True,
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
        status="RESOLVED",
        fraud_score=0.04,
        fraud_risk_level="Low",
        fraud_reasons=["Warehouse dispatch log confirms wrong SKU scanned at packing station."],
        policy_eligible="Eligible",
        policy_reference="Exchange Policy Section 2.3 - Fulfillment Error",
        policy_notes="Warehouse scan log confirms SKU error at distribution center #4.",
        evidence_urls=["/uploads/packing_slip.pdf"],
        evidence_summary={
            "damage_detected": False,
            "document_verified": True,
            "ocr_items": ["Expected SKU: KB-TITAN", "Scanned SKU: KB-PLASTIC"]
        },
        ocr_text="Expected SKU: KB-TITAN | Scanned SKU: KB-PLASTIC",
        resolution_action="Refund",
        resolution_reason="Fulfillment error verified by warehouse log. INR 320 refund credited to Digital Wallet.",
        confidence=0.98,
        customer_history_count=1
    )

    # Scenario 4: High-Value Workstation Policy Conflict (Escalated)
    d4 = Dispute(
        id="DISP-9845",
        customer_id="CUST-7710",
        customer_name="Elena Rostova",
        customer_email="elena.rostova@example.com",
        order_id="ORD-77109-55",
        category="Damaged Product",
        claim_amount=75000.0,
        complaint_text="My custom graphics workstation laptop arrived with a crushed chassis and cracked screen.",
        status="Requires_Review",
        fraud_score=0.12,
        fraud_risk_level="Low",
        fraud_reasons=["Corporate buyer verified", "Account clean", "Zero historical disputes"],
        policy_eligible="Eligible - Manager Sign-off Constraint",
        policy_reference="Policy Section 1.2 - High-Value Verification Constraint",
        policy_notes="Policy Conflict Triggered: Claim amount (INR 75,000 >= 50,000) mandates manual manager verification under Policy HIGHVALUE-1.2.",
        evidence_urls=["/uploads/workstation_invoice.pdf", "/uploads/crushed_chassis_photo.png"],
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

    # Scenario 5: Missing Unboxing Evidence (Evidence Required)
    d5 = Dispute(
        id="DISP-9846",
        customer_id="CUST-4421",
        customer_name="Marcus Vance",
        customer_email="marcus.vance@example.com",
        order_id="ORD-44210-91",
        category="Missing Product",
        claim_amount=8200.0,
        complaint_text="My package was delivered with broken tamper seals and the tablet pen was missing.",
        status="Requires_Review",
        fraud_score=0.25,
        fraud_risk_level="Medium",
        fraud_reasons=["Tamper seal claim requires photo proof"],
        policy_eligible="Pending Evidence Verification",
        policy_reference="Policy Section 3.4 - Missing Components Claim",
        policy_notes="Customer must provide clear photo of external packaging and shipping label.",
        evidence_urls=[],
        evidence_summary={"damage_detected": False, "document_verified": False},
        ocr_text="",
        resolution_action="Escalate",
        resolution_reason="Awaiting customer packaging photo before decision synthesis.",
        confidence=0.50,
        human_approval_required=True,
        customer_history_count=1
    )

    db.add_all([d1, d2, d3, d4, d5])
    db.commit()

    # 6. Seed Digital Wallets & Transactions
    print("Seeding digital wallets & transactions...")
    wallets = [
        Wallet(id="WAL-1001", customer_id="CUST-1001", customer_email="sarah.j@example.com", balance=1500.0, pending_refunds=0.0, total_refunded=899.99, currency="INR"),
        Wallet(id="WAL-9902", customer_id="CUST-9902", customer_email="alex.fraud@example.com", balance=0.0, pending_refunds=25000.0, total_refunded=0.0, currency="INR"),
        Wallet(id="WAL-3041", customer_id="CUST-3041", customer_email="dchen@techcorp.io", balance=820.0, pending_refunds=0.0, total_refunded=320.0, currency="INR"),
        Wallet(id="WAL-7710", customer_id="CUST-7710", customer_email="elena.rostova@example.com", balance=5000.0, pending_refunds=0.0, total_refunded=0.0, currency="INR"),
        Wallet(id="WAL-4421", customer_id="CUST-4421", customer_email="marcus.vance@example.com", balance=500.0, pending_refunds=0.0, total_refunded=0.0, currency="INR")
    ]
    db.add_all(wallets)

    transactions = [
        Transaction(id="TXN-501", customer_id="CUST-1001", customer_email="sarah.j@example.com", type="CREDIT", amount=500.0, currency="INR", status="COMPLETED", description="Welcome Member Credit"),
        Transaction(id="TXN-502", customer_id="CUST-1001", customer_email="sarah.j@example.com", order_id="ORD-58493-29", dispute_id="DISP-9842", type="REFUND", amount=899.99, currency="INR", status="COMPLETED", description="Refund credit for damaged smartphone screen"),
        Transaction(id="TXN-503", customer_id="CUST-3041", customer_email="dchen@techcorp.io", type="CREDIT", amount=500.0, currency="INR", status="COMPLETED", description="Welcome Member Credit"),
        Transaction(id="TXN-504", customer_id="CUST-3041", customer_email="dchen@techcorp.io", order_id="ORD-10928-84", dispute_id="DISP-9844", type="REFUND", amount=320.0, currency="INR", status="COMPLETED", description="Dispute refund for wrong keyboard SKU")
    ]
    db.add_all(transactions)

    # 7. Seed Replacement Shipments
    print("Seeding replacement shipments...")
    shipments = [
        ReplacementShipment(
            id="REP-9842",
            dispute_id="DISP-9842",
            order_id="ORD-58493-29",
            product_id="PROD-PHONE",
            product_name="Smartphone Model X 256GB",
            customer_id="CUST-1001",
            tracking_number="TRK-EXPRESS-984210",
            carrier="BlueDart Express",
            status="IN_TRANSIT",
            delivery_address="74, Richmond Town Road, Bengaluru, KA - 560025",
            estimated_delivery=now + timedelta(days=1)
        )
    ]
    db.add_all(shipments)

    # 8. Seed Customer Notifications
    print("Seeding customer notifications...")
    notifications = [
        Notification(customer_id="CUST-1001", customer_email="sarah.j@example.com", dispute_id="DISP-9842", title="Replacement Dispatched", message="Your replacement Smartphone Model X has shipped via BlueDart Express (TRK-EXPRESS-984210).", type="REPLACEMENT_SHIPPED", is_read=False),
        Notification(customer_id="CUST-1001", customer_email="sarah.j@example.com", dispute_id="DISP-9842", title="Dispute Case Approved", message="Dispute DISP-9842 was automatically verified and approved by the AI resolution engine.", type="RESOLVED", is_read=True),
        Notification(customer_id="CUST-9902", customer_email="alex.fraud@example.com", dispute_id="DISP-9843", title="Case In Review", message="Dispute DISP-9843 is currently being reviewed by an enterprise resolution specialist.", type="ADMIN_APPROVAL", is_read=False),
        Notification(customer_id="CUST-3041", customer_email="dchen@techcorp.io", dispute_id="DISP-9844", title="Refund Credited to Wallet", message="INR 320.00 has been credited to your digital wallet for wrong SKU fulfillment.", type="REFUND_ISSUED", is_read=False),
        Notification(customer_id="CUST-4421", customer_email="marcus.vance@example.com", dispute_id="DISP-9846", title="Evidence Required", message="Please upload a photo of the external box packaging to resume claim investigation.", type="EVIDENCE_REQUIRED", is_read=False)
    ]
    db.add_all(notifications)

    # 9. Seed Decision Passports (Explainable AI Certificates)
    print("Seeding Decision Passports...")
    passports = [
        DecisionPassportModel(
            dispute_id="DISP-9842",
            decision="Replacement Approved",
            confidence_score=0.95,
            fraud_risk_score=0.08,
            verified_evidence={
                "order_verified": True,
                "product_name": "Smartphone Model X 256GB",
                "damage_detected": True,
                "ocr_items": ["Smartphone Model X", "Total: $899.99", "Impact fracture verified"]
            },
            policy_matched="Refund Policy Section 4.2 - Damaged In Transit Coverage",
            policy_clause="Physical impact damage reported within 5 days qualifies for immediate express replacement.",
            customer_context={"customer_name": "Sarah Jenkins", "email": "sarah.j@example.com", "previous_claims": 0, "risk_status": "Clean Account History"},
            alternatives_evaluated=[
                {"action": "Replacement", "score": "95%", "reason": "Restores original utility with zero merchant loss"},
                {"action": "Full Refund", "score": "82%", "reason": "Credits customer payment method"},
                {"action": "Partial Credit", "score": "64%", "reason": "Not applicable for completely shattered screen"}
            ],
            final_reasoning="Replacement provides the most appropriate policy-compliant resolution based on verified impact evidence, low fraud risk (8%), and available stock.",
            execution_proof={"tracking_number": "TRK-EXPRESS-984210", "carrier": "BlueDart Express", "status": "DISPATCHED"}
        ),
        DecisionPassportModel(
            dispute_id="DISP-9844",
            decision="Refund Approved",
            confidence_score=0.98,
            fraud_risk_score=0.04,
            verified_evidence={
                "order_verified": True,
                "product_name": "Titanium Mechanical Gaming Keyboard",
                "damage_detected": False,
                "ocr_items": ["Expected: KB-TITAN", "Scanned: KB-PLASTIC", "Packing mismatch verified"]
            },
            policy_matched="Exchange Policy Section 2.3 - Fulfillment Error",
            policy_clause="Warehouse SKU scan mismatch entitles customer to instant digital refund or expedited re-dispatch.",
            customer_context={"customer_name": "David Chen", "email": "dchen@techcorp.io", "previous_claims": 1, "risk_status": "Verified Account"},
            alternatives_evaluated=[
                {"action": "Full Refund", "score": "98%", "reason": "Direct wallet credit executed instantly"},
                {"action": "Replacement", "score": "90%", "reason": "Requires warehouse replenishment cycle"}
            ],
            final_reasoning="Autonomous refund selected following distribution center SKU mismatch verification and minimal fraud score (4%).",
            execution_proof={"transaction_id": "TXN-504", "wallet_id": "WAL-3041", "amount": 320.0, "status": "COMPLETED"}
        )
    ]
    db.add_all(passports)

    # 10. Seed Agent Execution Logs
    print("Seeding agent trace logs...")
    logs = [
        # DISP-9842 Logs
        AgentLog(dispute_id="DISP-9842", agent_name="Customer Interaction Agent", action_taken="Intent Classification", log_details="Categorized intent: Damaged Product (98% confidence). Priority: High."),
        AgentLog(dispute_id="DISP-9842", agent_name="Evidence Verification Agent", action_taken="Vision OCR Analysis", log_details="OCR extracted invoice #9842 ($899.99). Image model confirmed screen impact fracture."),
        AgentLog(dispute_id="DISP-9842", agent_name="Fraud Detection Agent", action_taken="Risk Assessment", log_details="Calculated Fraud Score: 0.08 (Low Risk). Account active for 2 years with 0 past claims."),
        AgentLog(dispute_id="DISP-9842", agent_name="Policy Intelligence Agent", action_taken="RAG Similarity Search", log_details="Matched Policy Section 4.2: 30-Day Damaged Transit Coverage. Status: Eligible."),
        AgentLog(dispute_id="DISP-9842", agent_name="Resolution Strategy Agent", action_taken="Strategy Decision", log_details="Recommended Action: Replacement Approved (Confidence: 95%)."),
        AgentLog(dispute_id="DISP-9842", agent_name="Workflow Execution Agent", action_taken="API Execution", log_details="Triggered ERP Shipping API: Order #TRK-EXPRESS-984210 dispatched via BlueDart Express."),

        # DISP-9843 Logs
        AgentLog(dispute_id="DISP-9843", agent_name="Customer Interaction Agent", action_taken="Intent Classification", log_details="Categorized intent: Refund Request. Priority: Urgent."),
        AgentLog(dispute_id="DISP-9843", agent_name="Evidence Verification Agent", action_taken="Carrier OCR Check", log_details="OCR extracted carrier proof: Signed by 'A. RIVERA' on 2026-08-05."),
        AgentLog(dispute_id="DISP-9843", agent_name="Fraud Detection Agent", action_taken="Risk Assessment", log_details="FLAGGED: Fraud Score 0.88 (High Risk). 5 refund claims in last 30 days."),
        AgentLog(dispute_id="DISP-9843", agent_name="Policy Intelligence Agent", action_taken="RAG Search", log_details="Matched Policy Section 8.1: Mandatory audit for high claim frequency."),
        AgentLog(dispute_id="DISP-9843", agent_name="Human Approval Agent", action_taken="Escalation Triggered", log_details="Claim halted. Placed in Admin Human Approval Queue.")
    ]
    db.add_all(logs)

    # 11. Seed Audit Logs
    print("Seeding enterprise audit logs...")
    audits = [
        AuditLog(operator="sarah.j@example.com", action="DISPUTE_SUBMITTED", details="Dispute DISP-9842 submitted for Order ORD-58493-29 with 2 evidence attachments."),
        AuditLog(operator="System AI Graph", action="DECISION_SYNTHESIS", details="Autonomous resolution assigned: Replacement Approved (Confidence: 95%)."),
        AuditLog(operator="alex.fraud@example.com", action="DISPUTE_SUBMITTED", details="Dispute DISP-9843 submitted for Order ORD-98204-11."),
        AuditLog(operator="Fraud Detection Agent", action="RISK_ESCALATION", details="Dispute DISP-9843 escalated to Admin Queue. Risk score: 88%."),
        AuditLog(operator="admin@resolve.ai", action="ADMIN_LOGIN", details="Admin authenticated to enterprise governance console.")
    ]
    db.add_all(audits)

    db.commit()
    db.close()
    print("=========================================================")
    print(" [OK] SEEDING COMPLETED SUCCESSFULLY!                    ")
    print(" Single source of truth database is fully initialized!    ")
    print("=========================================================")

if __name__ == "__main__":
    init_db()
