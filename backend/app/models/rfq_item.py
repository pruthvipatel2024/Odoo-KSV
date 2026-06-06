from app.database import db

class RFQItem(db.Model):
    __tablename__ = 'rfq_items'

    id = db.Column(db.Integer, primary_key=True)
    rfq_id = db.Column(db.Integer, db.ForeignKey('rfqs.id', ondelete='CASCADE'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    rfq = db.relationship('RFQ', back_populates='items')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "rfq_id": self.rfq_id,
            "description": self.description,
            "quantity": self.quantity
        }
