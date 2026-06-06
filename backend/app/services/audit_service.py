from app.database import db
from app.models.audit import ActivityLog
from app.models.approval import ApprovalHistory

class AuditService:

    @staticmethod
    def log_activity(user_id, action, details=None):
        """
        Creates a system audit trail log
        """
        try:
            log = ActivityLog(
                user_id=user_id,
                action=action,
                details=details
            )
            db.session.add(log)
            db.session.commit()
            return log
        except Exception as e:
            # Fallback prints to console if database is not ready
            print(f"Audit Log Error: {e}")
            return None

    @staticmethod
    def log_approval(entity_type, entity_id, status_from, status_to, action_by, remarks=None):
        """
        Records a status state transition for workflows (Vendor, Quotation, PO)
        """
        try:
            history = ApprovalHistory(
                entity_type=entity_type,
                entity_id=entity_id,
                status_from=status_from,
                status_to=status_to,
                action_by=action_by,
                remarks=remarks
            )
            db.session.add(history)
            db.session.commit()
            return history
        except Exception as e:
            print(f"Approval History Log Error: {e}")
            return None

    @staticmethod
    def get_approval_history(entity_type, entity_id):
        return ApprovalHistory.query.filter_by(
            entity_type=entity_type,
            entity_id=entity_id
        ).order_by(ApprovalHistory.created_at.asc()).all()

    @staticmethod
    def get_activity_logs(limit=100):
        return ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
