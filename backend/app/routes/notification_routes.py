from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notification_service import NotificationService

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for the current user."""
    current_user_id = int(get_jwt_identity())
    unread_only = request.args.get('unread', 'false').lower() == 'true'
    notifications = NotificationService.get_for_user(current_user_id, unread_only=unread_only)
    return jsonify([n.to_dict() for n in notifications]), 200


@notifications_bp.route('/api/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications."""
    current_user_id = int(get_jwt_identity())
    count = NotificationService.unread_count(current_user_id)
    return jsonify({"count": count}), 200


@notifications_bp.route('/api/notifications/<int:notification_id>/read', methods=['PATCH'])
@jwt_required()
def mark_read(notification_id):
    """Mark a specific notification as read."""
    current_user_id = int(get_jwt_identity())
    n = NotificationService.mark_read(notification_id, current_user_id)
    if not n:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify(n.to_dict()), 200


@notifications_bp.route('/api/notifications/read-all', methods=['PATCH'])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read."""
    current_user_id = int(get_jwt_identity())
    NotificationService.mark_all_read(current_user_id)
    return jsonify({"message": "All notifications marked as read"}), 200
