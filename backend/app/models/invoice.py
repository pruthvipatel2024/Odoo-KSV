from datetime import datetime
from app.database import db

class Invoice(db.Model):
    __tablename__ = 'invoices'

    id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id', ondelete='RESTRICT'), nullable=False)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor_profiles.id', ondelete='RESTRICT'), nullable=False)
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)
    gst_rate = db.Column(db.Numeric(5, 2), default=18.00, nullable=False)
    gst_amount = db.Column(db.Numeric(12, 2), nullable=False)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(20), default='PENDING', nullable=False)  # PENDING, PAID, VOID
    invoice_date = db.Column(db.Date, nullable=False)
    pdf_url = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    purchase_order = db.relationship('PurchaseOrder', back_populates='invoices')
    vendor = db.relationship('VendorProfile', back_populates='invoices')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "po_id": self.po_id,
            "invoice_number": self.invoice_number,
            "vendor_id": self.vendor_id,
            "subtotal": float(self.subtotal),
            "gst_rate": float(self.gst_rate),
            "gst_amount": float(self.gst_amount),
            "total_amount": float(self.total_amount),
            "status": self.status,
            "invoice_date": self.invoice_date.isoformat(),
            "pdf_url": self.pdf_url,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
