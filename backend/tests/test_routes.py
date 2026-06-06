import unittest
import json
from datetime import datetime, timedelta
from app import create_app
from app.database import db
from app.config import Config
from app.models.user import User
from app.models.vendor import VendorProfile
from flask_jwt_extended import create_access_token

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-jwt-secret'
    SECRET_KEY = 'test-secret'

class TestRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        self.seed_users()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def seed_users(self):
        # Create users for testing RBAC
        self.admin = User(email='admin@test.local', first_name='A', last_name='S', role='ADMIN', is_active=True)
        self.admin.set_password('Admin@123')
        
        self.officer = User(email='officer@test.local', first_name='O', last_name='P', role='PROCUREMENT', is_active=True)
        self.officer.set_password('Officer@123')
        
        self.vendor_user = User(email='vendor@test.local', first_name='V', last_name='K', role='VENDOR', is_active=True)
        self.vendor_user.set_password('Vendor@123')
        
        db.session.add_all([self.admin, self.officer, self.vendor_user])
        db.session.flush()

        self.vendor = VendorProfile(
            user_id=self.vendor_user.id,
            company_name='Test Vendor',
            gst_number='27AAAAA1111A1Z1',
            contact_email='vendor@test.local',
            status='APPROVED'
        )
        db.session.add(self.vendor)
        db.session.commit()

    def get_auth_headers(self, user):
        additional_claims = {
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
        token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def test_auth_routes(self):
        # Register Vendor User
        reg_payload = {
            "email": "vendor2@test.local",
            "first_name": "Second",
            "last_name": "Vendor",
            "role": "VENDOR",
            "password": "Vendor@123",
            "company_name": "Second Vendor Ltd",
            "gst_number": "27BBBBB2222B2Z2"
        }
        resp = self.client.post('/api/auth/register', data=json.dumps(reg_payload), content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        data = json.loads(resp.data)
        self.assertEqual(data['user']['email'], 'vendor2@test.local')

        # Login User
        login_payload = {
            "email": "vendor2@test.local",
            "password": "Vendor@123"
        }
        resp = self.client.post('/api/auth/login', data=json.dumps(login_payload), content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn('token', data)

        # GET /api/auth/me
        headers = {
            "Authorization": f"Bearer {data['token']}",
            "Content-Type": "application/json"
        }
        resp = self.client.get('/api/auth/me', headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data['email'], 'vendor2@test.local')

    def test_rbac_guards(self):
        # Vendor attempts to access dashboard activity logs (restricted to internal staff)
        v_headers = self.get_auth_headers(self.vendor_user)
        resp = self.client.get('/api/dashboard/logs', headers=v_headers)
        self.assertEqual(resp.status_code, 403) # Forbidden

        # Admin attempts to access dashboard logs (should succeed)
        a_headers = self.get_auth_headers(self.admin)
        resp = self.client.get('/api/dashboard/logs', headers=a_headers)
        self.assertEqual(resp.status_code, 200)

    def test_rfq_routes(self):
        o_headers = self.get_auth_headers(self.officer)
        rfq_payload = {
            "title": "New Server Purchase",
            "description": "5 Rack mountable high memory server nodes",
            "deadline": (datetime.utcnow() + timedelta(days=10)).isoformat(),
            "vendor_ids": [self.vendor.id],
            "items": [
                {
                    "description": "Rack Server Node X",
                    "quantity": 5
                }
            ]
        }
        resp = self.client.post('/api/rfqs', data=json.dumps(rfq_payload), headers=o_headers)
        self.assertEqual(resp.status_code, 201)
        data = json.loads(resp.data)
        self.assertEqual(data['title'], 'New Server Purchase')

        # List RFQs
        resp = self.client.get('/api/rfqs', headers=o_headers)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(len(data) > 0)
