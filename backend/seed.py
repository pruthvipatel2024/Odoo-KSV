from datetime import datetime, timedelta
from app import create_app
from app.database import db
from app.models.user import User
from app.models.vendor import VendorProfile
from app.models.rfq import RFQ, RFQDocument
from app.models.quotation import Quotation, QuotationItem
from app.models.purchase_order import PurchaseOrder
from app.models.invoice import Invoice
from app.services.audit_service import AuditService

def seed_db():
    app = create_app()
    with app.app_context():
        print("Recreating database tables...")
        # Create all tables (handy for SQLite development)
        db.create_all()
        
        # Check if users already exist
        if User.query.first():
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding initial users...")
        
        # 1. Admin User
        admin = User(
            email='admin@vendorbridge.local',
            first_name='Aravind',
            last_name='Sharma',
            role='ADMIN',
            is_active=True
        )
        admin.set_password('Admin@123')
        db.session.add(admin)
        
        # 2. Procurement Officer
        procurement = User(
            email='procurement@vendorbridge.local',
            first_name='Sneha',
            last_name='Patel',
            role='PROCUREMENT',
            is_active=True
        )
        procurement.set_password('Officer@123')
        db.session.add(procurement)
        
        # 3. Manager
        manager = User(
            email='manager@vendorbridge.local',
            first_name='Vikram',
            last_name='Rao',
            role='MANAGER',
            is_active=True
        )
        manager.set_password('Manager@123')
        db.session.add(manager)
        
        # 4. Vendor Users & Profiles
        # Vendor 1
        vendor_user_1 = User(
            email='vendor1@vendorbridge.local',
            first_name='Rajesh',
            last_name='Kumar',
            role='VENDOR',
            is_active=True
        )
        vendor_user_1.set_password('Vendor@123')
        db.session.add(vendor_user_1)
        db.session.flush()
        
        vendor_profile_1 = VendorProfile(
            user_id=vendor_user_1.id,
            company_name='Acme Industrial Solutions Pvt Ltd',
            gst_number='27AAAAA1111A1Z1',
            contact_email='vendor1@vendorbridge.local',
            contact_phone='+91 98765 43210',
            address='102, Phase 2, MIDC, Andheri East, Mumbai, MH - 400069',
            status='APPROVED', # Pre-approve for immediate testing
            rating=4.8
        )
        db.session.add(vendor_profile_1)

        # Vendor 2
        vendor_user_2 = User(
            email='vendor2@vendorbridge.local',
            first_name='Amit',
            last_name='Singh',
            role='VENDOR',
            is_active=True
        )
        vendor_user_2.set_password('Vendor@123')
        db.session.add(vendor_user_2)
        db.session.flush()
        
        vendor_profile_2 = VendorProfile(
            user_id=vendor_user_2.id,
            company_name='Beta Global Supplies Inc',
            gst_number='27BBBBB2222B2Z2',
            contact_email='vendor2@vendorbridge.local',
            contact_phone='+91 87654 32109',
            address='Suite 404, Tech Park, Sector 62, Noida, UP - 201301',
            status='APPROVED',
            rating=4.5
        )
        db.session.add(vendor_profile_2)

        # Vendor 3 (Awaiting Approval)
        vendor_user_3 = User(
            email='vendor3@vendorbridge.local',
            first_name='Rohan',
            last_name='Deshmukh',
            role='VENDOR',
            is_active=True
        )
        vendor_user_3.set_password('Vendor@123')
        db.session.add(vendor_user_3)
        db.session.flush()
        
        vendor_profile_3 = VendorProfile(
            user_id=vendor_user_3.id,
            company_name='Gamma Logistics & Machinery',
            gst_number='27CCCCC3333C3Z3',
            contact_email='vendor3@vendorbridge.local',
            contact_phone='+91 76543 21098',
            address='G-12, Industrial Area, Peenya, Bangalore, KA - 560058',
            status='PENDING', # Pending approval to test validation flows!
            rating=4.2
        )
        db.session.add(vendor_profile_3)
        
        db.session.flush() # Secure all IDs
        
        print("Seeding sample RFQs...")
        # RFQ 1: Office Equipment
        rfq1 = RFQ(
            rfq_number='RFQ-2026-0001',
            title='Procurement of High-Performance Laptops',
            description='Requirement of 10 Developer-grade Laptops. Specs: 32GB RAM, 1TB SSD, Core i7 or equivalent processor.',
            deadline=datetime.utcnow() + timedelta(days=7),
            status='OPEN',
            created_by=procurement.id
        )
        rfq1.vendors.append(vendor_profile_1)
        rfq1.vendors.append(vendor_profile_2)
        db.session.add(rfq1)
        
        # RFQ 2: Heavy Steel Pipe Supply
        rfq2 = RFQ(
            rfq_number='RFQ-2026-0002',
            title='Structural Steel Pillars and Pipes',
            description='Requirement for high-density seamless steel tubes for office building basement structure.',
            deadline=datetime.utcnow() + timedelta(days=14),
            status='OPEN',
            created_by=procurement.id
        )
        rfq2.vendors.append(vendor_profile_1)
        rfq2.vendors.append(vendor_profile_2)
        rfq2.vendors.append(vendor_profile_3)
        db.session.add(rfq2)
        
        # RFQ 3: Office Furniture (DRAFT)
        rfq3 = RFQ(
            rfq_number='RFQ-2026-0003',
            title='Ergonomic Chairs and Executive Desks',
            description='RFQ for designing interior layout seating. Drafting specs for approval.',
            deadline=datetime.utcnow() + timedelta(days=5),
            status='DRAFT',
            created_by=procurement.id
        )
        rfq3.vendors.append(vendor_profile_1)
        db.session.add(rfq3)
        
        db.session.flush()
        
        print("Seeding sample Quotations...")
        
        # Quotation 1: Acme bids on Laptops
        q1 = Quotation(
            rfq_id=rfq1.id,
            vendor_id=vendor_profile_1.id,
            total_price=950000.00,
            delivery_lead_time_days=5,
            status='SUBMITTED',
            remarks='Offering premium Dell Latitude series laptops with extended 3-year warranty.'
        )
        db.session.add(q1)
        db.session.flush()
        
        q1_item = QuotationItem(
            quotation_id=q1.id,
            item_description='Dell Latitude 32GB Core i7 1TB SSD',
            quantity=10,
            unit_price=95000.00,
            total_price=950000.00
        )
        db.session.add(q1_item)
        
        # Quotation 2: Beta bids on Laptops (Lowest price, longer lead time)
        q2 = Quotation(
            rfq_id=rfq1.id,
            vendor_id=vendor_profile_2.id,
            total_price=900000.00,
            delivery_lead_time_days=10,
            status='SUBMITTED',
            remarks='Offering HP ProBook series with standard 1-year warranty.'
        )
        db.session.add(q2)
        db.session.flush()
        
        q2_item = QuotationItem(
            quotation_id=q2.id,
            item_description='HP ProBook 32GB Ryzen 7 1TB SSD',
            quantity=10,
            unit_price=90000.00,
            total_price=900000.00
        )
        db.session.add(q2_item)
        
        db.session.commit()
        
        # Log system setup activity
        AuditService.log_activity(
            user_id=admin.id,
            action="SYSTEM_INIT",
            details="System databases seeded with initial roles, vendors, and sample procurement listings."
        )
        
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_db()
