from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(allowed_roles):
    """
    Decorator to restrict route access based on user roles.
    Assumes user has a role claim in their JWT token.
    allowed_roles can be a string or a list of strings: e.g. ['ADMIN', 'MANAGER']
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
        
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Verify JWT exists in request
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role', '').upper()
            
            if user_role not in [role.upper() for role in allowed_roles]:
                return jsonify({
                    "msg": "Forbidden: You do not have permission to access this resource",
                    "required_roles": allowed_roles,
                    "your_role": user_role
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator
