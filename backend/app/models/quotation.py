from datetime import datetime
from app.database import db

class Quotation(db.Model):
    __tablename__ = 'quotations'

    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfqs.id', ondelete='CASCADE'), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor_profiles.id', ondelete='CASCADE'), nullable=False)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)
    delivery_lead_time_days = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='SUBMITTED', nullable=False)  # SUBMITTED, UNDER_REVIEW, SHORTLISTED, ACCEPTED, REJECTED
    remarks = db.Column(db.Text, nullable=True)
    document_url = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    rfq = db.relationship('RFQ', back_populates='quotations')
    vendor = db.relationship('VendorProfile', back_populates='quotations')
    items = db.relationship('QuotationItem', back_populates='quotation', cascade="all, delete-orphan")
    purchase_orders = db.relationship('PurchaseOrder', back_populates='quotation')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "rfq_id": self.rfq_id,
            "vendor_id": self.vendor_id,
            "total_price": float(self.total_price),
            "delivery_lead_time_days": self.delivery_lead_time_days,
            "status": self.status,
            "remarks": self.remarks,
            "document_url": self.document_url,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "items": [item.to_dict() for item in self.items]
        }

class QuotationItem(db.Model):
    __tablename__ = 'quotation_items'

    id = db.Column(db.Integer, primary_key=True)
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id', ondelete='CASCADE'), nullable=False)
    item_description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)

    quotation = db.relationship('Quotation', back_populates='items')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "quotation_id": self.quotation_id,
            "item_description": self.item_description,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
            "total_price": float(self.total_price)
        }
