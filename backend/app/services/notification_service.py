from app.database import db
from app.models.notification import Notification


class NotificationService:

    @staticmethod
    def create(user_id: int, title: str, message: str, type: str = 'INFO', link: str = None):
        """Create a notification for a specific user."""
        try:
            n = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=type,
                link=link
            )
            db.session.add(n)
            db.session.commit()
            return n
        except Exception:
            db.session.rollback()

    @staticmethod
    def get_for_user(user_id: int, unread_only: bool = False):
        """Fetch notifications for a user, newest first, limit 50."""
        q = Notification.query.filter_by(user_id=user_id)
        if unread_only:
            q = q.filter_by(is_read=False)
        return q.order_by(Notification.created_at.desc()).limit(50).all()

    @staticmethod
    def mark_read(notification_id: int, user_id: int):
        """Mark a notification as read (owned by user)."""
        n = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        if n:
            n.is_read = True
            db.session.commit()
        return n

    @staticmethod
    def mark_all_read(user_id: int):
        """Mark all notifications for a user as read."""
        Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()

    @staticmethod
    def unread_count(user_id: int) -> int:
        return Notification.query.filter_by(user_id=user_id, is_read=False).count()
