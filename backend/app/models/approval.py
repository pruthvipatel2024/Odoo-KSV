from datetime import datetime
from app.database import db

class ApprovalHistory(db.Model):
    __tablename__ = 'approval_history'

    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(20), nullable=False, index=True)  # PO, VENDOR, QUOTATION
    entity_id = db.Column(db.Integer, nullable=False, index=True)
    status_from = db.Column(db.String(50), nullable=True)
    status_to = db.Column(db.String(50), nullable=False)
    action_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    actor = db.relationship('User')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "status_from": self.status_from,
            "status_to": self.status_to,
            "action_by": self.action_by,
            "actor_name": f"{self.actor.first_name} {self.actor.last_name}" if self.actor else "System",
            "remarks": self.remarks,
            "created_at": self.created_at.isoformat()
        }
