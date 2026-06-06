import unittest
from datetime import datetime, timedelta
from app import create_app
from app.database import db
from app.config import Config
from app.models.user import User
from app.models.vendor import VendorProfile
from app.models.rfq import RFQ, RFQDocument
from app.models.quotation import Quotation, QuotationItem
from app.models.purchase_order import PurchaseOrder
from app.models.invoice import Invoice

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-jwt-secret'
    SECRET_KEY = 'test-secret'

class TestModels(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_user_creation(self):
        user = User(
            email='test@vendorbridge.local',
            first_name='Test',
            last_name='User',
            role='VENDOR'
        )
        user.set_password('Password@123')
        db.session.add(user)
        db.session.commit()

        self.assertIsNotNone(user.id)
        self.assertTrue(user.check_password('Password@123'))
        self.assertFalse(user.check_password('WrongPassword'))
        
        user_dict = user.to_dict()
        self.assertEqual(user_dict['email'], 'test@vendorbridge.local')
        self.assertEqual(user_dict['role'], 'VENDOR')

    def test_vendor_profile_creation(self):
        user = User(
            email='vendor@test.local',
            first_name='Vendor',
            last_name='User',
            role='VENDOR'
        )
        user.set_password('Vendor@123')
        db.session.add(user)
        db.session.commit()

        vendor = VendorProfile(
            user_id=user.id,
            company_name='Test Vendor Co',
            gst_number='27TESTA1234A1Z1',
            contact_email='vendor@test.local',
            status='PENDING',
            rating=4.5
        )
        db.session.add(vendor)
        db.session.commit()

        self.assertIsNotNone(vendor.id)
        self.assertEqual(vendor.company_name, 'Test Vendor Co')
        self.assertEqual(vendor.user.email, 'vendor@test.local')
        
        vendor_dict = vendor.to_dict()
        self.assertEqual(vendor_dict['gst_number'], '27TESTA1234A1Z1')
        self.assertEqual(vendor_dict['rating'], 4.5)

    def test_rfq_creation(self):
        user = User(
            email='officer@test.local',
            first_name='Officer',
            last_name='User',
            role='PROCUREMENT'
        )
        user.set_password('Officer@123')
        db.session.add(user)
        db.session.commit()

        rfq = RFQ(
            rfq_number='RFQ-TEST-001',
            title='Test RFQ',
            description='Test RFQ Description',
            deadline=datetime.utcnow() + timedelta(days=7),
            status='DRAFT',
            created_by=user.id
        )
        db.session.add(rfq)
        db.session.commit()

        self.assertIsNotNone(rfq.id)
        self.assertEqual(rfq.rfq_number, 'RFQ-TEST-001')
        
        rfq_dict = rfq.to_dict()
        self.assertEqual(rfq_dict['title'], 'Test RFQ')

        doc = RFQDocument(
            rfq_id=rfq.id,
            file_name='specs.pdf',
            file_url='http://example.com/specs.pdf'
        )
        db.session.add(doc)
        db.session.commit()
        self.assertIsNotNone(doc.id)
        self.assertEqual(doc.file_name, 'specs.pdf')

    def test_quotation_creation(self):
        user = User(
            email='vendor@test.local',
            first_name='Vendor',
            last_name='User',
            role='VENDOR'
        )
        user.set_password('Vendor@123')
        db.session.add(user)
        db.session.flush()

        vendor = VendorProfile(
            user_id=user.id,
            company_name='Test Vendor Co',
            gst_number='27TESTA1234A1Z1',
            contact_email='vendor@test.local'
        )
        db.session.add(vendor)

        rfq = RFQ(
            rfq_number='RFQ-TEST-002',
            title='Test RFQ 2',
            deadline=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(rfq)
        db.session.flush()

        q = Quotation(
            rfq_id=rfq.id,
            vendor_id=vendor.id,
            total_price=50000.00,
            delivery_lead_time_days=5,
            status='SUBMITTED'
        )
        db.session.add(q)
        db.session.flush()

        item = QuotationItem(
            quotation_id=q.id,
            item_description='Test Item',
            quantity=5,
            unit_price=10000.00,
            total_price=50000.00
        )
        db.session.add(item)
        db.session.commit()

        self.assertIsNotNone(q.id)
        self.assertIsNotNone(item.id)
        self.assertEqual(len(q.items), 1)
        self.assertEqual(q.items[0].item_description, 'Test Item')

    def test_purchase_order_and_invoice(self):
        # Create users
        officer = User(email='o@test.local', first_name='O', last_name='U', role='PROCUREMENT', password_hash='hash')
        vendor_user = User(email='v@test.local', first_name='V', last_name='U', role='VENDOR', password_hash='hash')
        db.session.add_all([officer, vendor_user])
        db.session.flush()

        vendor = VendorProfile(user_id=vendor_user.id, company_name='V', gst_number='GST1', contact_email='v@test.local')
        db.session.add(vendor)
        db.session.flush()

        rfq = RFQ(rfq_number='RFQ-PO-1', title='PO RFQ', deadline=datetime.utcnow() + timedelta(days=7))
        db.session.add(rfq)
        db.session.flush()

        q = Quotation(rfq_id=rfq.id, vendor_id=vendor.id, total_price=20000.00, delivery_lead_time_days=3)
        db.session.add(q)
        db.session.flush()

        po = PurchaseOrder(
            po_number='PO-TEST-001',
            rfq_id=rfq.id,
            quotation_id=q.id,
            vendor_id=vendor.id,
            total_amount=20000.00,
            status='PENDING_APPROVAL',
            created_by=officer.id
        )
        db.session.add(po)
        db.session.flush()

        invoice = Invoice(
            po_id=po.id,
            invoice_number='INV-TEST-001',
            vendor_id=vendor.id,
            subtotal=16949.15,
            gst_rate=18.00,
            gst_amount=3050.85,
            total_amount=20000.00,
            status='PENDING',
            invoice_date=datetime.utcnow().date()
        )
        db.session.add(invoice)
        db.session.commit()

        self.assertIsNotNone(po.id)
        self.assertIsNotNone(invoice.id)
        self.assertEqual(invoice.invoice_number, 'INV-TEST-001')
        self.assertEqual(po.po_number, 'PO-TEST-001')
