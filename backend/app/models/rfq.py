from datetime import datetime
from app.database import db

# Association Table for RFQs assigned to multiple Vendors
rfq_vendors = db.Table(
    'rfq_vendors',
    db.Column('rfq_id', db.Integer, db.ForeignKey('rfqs.id', ondelete='CASCADE'), primary_key=True),
    db.Column('vendor_id', db.Integer, db.ForeignKey('vendor_profiles.id', ondelete='CASCADE'), primary_key=True)
)

class RFQ(db.Model):
    __tablename__ = 'rfqs'

    id = db.Column(db.Integer, primary_key=True)
    rfq_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='DRAFT', nullable=False)  # DRAFT, OPEN, CLOSED, PROCESSED, CANCELLED
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by])
    vendors = db.relationship('VendorProfile', secondary=rfq_vendors, back_populates='rfqs')
    documents = db.relationship('RFQDocument', back_populates='rfq', cascade="all, delete-orphan")
    quotations = db.relationship('Quotation', back_populates='rfq', cascade="all, delete-orphan")
    purchase_orders = db.relationship('PurchaseOrder', back_populates='rfq')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "rfq_number": self.rfq_number,
            "title": self.title,
            "description": self.description,
            "deadline": self.deadline.isoformat(),
            "status": self.status,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "vendors": [v.to_dict() for v in self.vendors]
        }

class RFQDocument(db.Model):
    __tablename__ = 'rfq_documents'

    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfqs.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_url = db.Column(db.String(512), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    rfq = db.relationship('RFQ', back_populates='documents')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "rfq_id": self.rfq_id,
            "file_name": self.file_name,
            "file_url": self.file_url,
            "created_at": self.created_at.isoformat()
        }
