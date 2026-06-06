from datetime import datetime
from app.database import db

class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_orders'

    id = db.Column(db.Integer, primary_key=True)
    po_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfqs.id', ondelete='RESTRICT'), nullable=False)
    quotation_id = db.Column(db.Integer, db.ForeignKey('quotations.id', ondelete='RESTRICT'), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor_profiles.id', ondelete='RESTRICT'), nullable=False)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(20), default='PENDING_APPROVAL', nullable=False)  # PENDING_APPROVAL, APPROVED, REJECTED, SENT, COMPLETED, CANCELLED
    remarks = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    rfq = db.relationship('RFQ', back_populates='purchase_orders')
    quotation = db.relationship('Quotation', back_populates='purchase_orders')
    vendor = db.relationship('VendorProfile', back_populates='purchase_orders')
    creator = db.relationship('User', foreign_keys=[created_by])
    approver = db.relationship('User', foreign_keys=[approved_by])
    invoices = db.relationship('Invoice', back_populates='purchase_order', cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "po_number": self.po_number,
            "rfq_id": self.rfq_id,
            "quotation_id": self.quotation_id,
            "vendor_id": self.vendor_id,
            "total_amount": float(self.total_amount),
            "status": self.status,
            "remarks": self.remarks,
            "created_by": self.created_by,
            "approved_by": self.approved_by,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
