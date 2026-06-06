import unittest
from datetime import datetime, timedelta
from app import create_app
from app.database import db
from app.config import Config
from app.models.user import User
from app.models.vendor import VendorProfile
from app.models.rfq import RFQ
from app.models.quotation import Quotation
from app.models.purchase_order import PurchaseOrder
from app.models.invoice import Invoice
from app.services.auth_service import AuthService
from app.services.rfq_service import RFQService
from app.services.quotation_service import QuotationService
from app.services.po_service import POService
from app.services.invoice_service import InvoiceService

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-jwt-secret'
    SECRET_KEY = 'test-secret'

class TestServices(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.seed_base_data()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def seed_base_data(self):
        # Create officer
        self.officer = User(
            email='officer@vendorbridge.local',
            first_name='Sneha',
            last_name='Patel',
            role='PROCUREMENT',
            is_active=True
        )
        self.officer.set_password('Officer@123')
        
        # Create manager
        self.manager = User(
            email='manager@vendorbridge.local',
            first_name='Vikram',
            last_name='Rao',
            role='MANAGER',
            is_active=True
        )
        self.manager.set_password('Manager@123')
        
        db.session.add_all([self.officer, self.manager])
        db.session.commit()

    def test_auth_service_registration_and_login(self):
        data = {
            "email": "vendor_new@test.local",
            "first_name": "New",
            "last_name": "Vendor",
            "role": "VENDOR",
            "password": "Vendor@123",
            "company_name": "New Vendor Co",
            "gst_number": "27NEWVA1234A1Z1"
        }
        user = AuthService.register_user(data)
        self.assertIsNotNone(user.id)
        self.assertEqual(user.email, "vendor_new@test.local")
        self.assertEqual(user.vendor_profile.company_name, "New Vendor Co")

        # Login
        auth_data = AuthService.authenticate_user("vendor_new@test.local", "Vendor@123")
        self.assertIsNotNone(auth_data)
        self.assertIn("token", auth_data)
        self.assertEqual(auth_data["user"]["role"], "VENDOR")

    def test_rfq_and_quotation_workflows(self):
        # Register a vendor first
        v_data = {
            "email": "vendor@test.local",
            "first_name": "V",
            "last_name": "U",
            "role": "VENDOR",
            "password": "Vendor@123",
            "company_name": "V Company",
            "gst_number": "27GSTNUMBER123A"
        }
        vendor_user = AuthService.register_user(v_data)
        vendor = vendor_user.vendor_profile
        vendor.status = 'APPROVED'
        db.session.commit()

        # Create RFQ
        rfq_data = {
            "title": "Procurement of Servers",
            "description": "2 High end database servers",
            "deadline": (datetime.utcnow() + timedelta(days=5)).isoformat(),
            "vendor_ids": [vendor.id]
        }
        rfq = RFQService.create_rfq(rfq_data, self.officer.id)
        self.assertIsNotNone(rfq.id)
        self.assertEqual(rfq.status, "OPEN")
        self.assertEqual(len(rfq.vendors), 1)

        # Submit Quotation
        q_data = {
            "delivery_lead_time_days": 7,
            "remarks": "Submitting server quote",
            "items": [
                {
                    "item_description": "DB Server 64GB",
                    "quantity": 2,
                    "unit_price": 250000.00
                }
            ]
        }
        q = QuotationService.submit_quotation(rfq.id, vendor.id, q_data, file=None)
        self.assertIsNotNone(q.id)
        self.assertEqual(q.total_price, 500000.00)
        self.assertEqual(q.status, "SUBMITTED")

        # Award PO from Quotation
        po_payload = {
            "rfq_id": rfq.id,
            "quotation_id": q.id,
            "remarks": "Awarding server contract"
        }
        po = POService.create_purchase_order(po_payload, self.officer.id)
        self.assertIsNotNone(po.id)
        self.assertEqual(po.total_amount, 500000.00)
        self.assertEqual(po.status, "PENDING_APPROVAL")

        # Approve PO by Manager
        po = POService.change_po_status(po.id, 'APPROVED', "Looks good, approve budget", self.manager.id)
        self.assertEqual(po.status, "APPROVED")

        # Create Invoice by Vendor
        inv_payload = {
            "po_id": po.id,
            "invoice_number": "INV-2026-0001",
            "invoice_date": datetime.utcnow().date().isoformat()
        }
        invoice = InvoiceService.create_invoice(inv_payload, vendor.id, vendor_user.id)
        self.assertIsNotNone(invoice.id)
        self.assertEqual(invoice.status, "PENDING")
        self.assertEqual(invoice.total_amount, 590000.00)
        
        # Verify GST amount (18% of 500000)
        self.assertEqual(float(invoice.gst_amount), 90000.00)

        # Pay Invoice
        paid_invoice = InvoiceService.pay_invoice(invoice.id, self.manager.id)
        self.assertEqual(paid_invoice.status, "PAID")
