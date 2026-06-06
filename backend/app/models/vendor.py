from datetime import datetime
from app.database import db

class VendorProfile(db.Model):
    __tablename__ = 'vendor_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), unique=True, nullable=True)
    company_name = db.Column(db.String(150), nullable=False)
    gst_number = db.Column(db.String(15), unique=True, nullable=False, index=True)
    contact_email = db.Column(db.String(150), nullable=False)
    contact_phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='PENDING', nullable=False)  # PENDING, APPROVED, REJECTED, BLACKLISTED
    rating = db.Column(db.Numeric(3, 2), default=5.00, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='vendor_profile')
    quotations = db.relationship('Quotation', back_populates='vendor', cascade="all, delete-orphan")
    purchase_orders = db.relationship('PurchaseOrder', back_populates='vendor')
    invoices = db.relationship('Invoice', back_populates='vendor')

    # Many-to-many relationship back-populates to RFQ
    rfqs = db.relationship('RFQ', secondary='rfq_vendors', back_populates='vendors')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "gst_number": self.gst_number,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "address": self.address,
            "category": self.category,
            "status": self.status,
            "rating": float(self.rating) if self.rating else 0.0,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
