from app.database import db
from datetime import datetime


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False, default='INFO')  # INFO, SUCCESS, WARNING, ERROR
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    link = db.Column(db.String(255), nullable=True)  # Optional navigation link
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic'))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "is_read": self.is_read,
            "link": self.link,
            "created_at": self.created_at.isoformat()
        }
