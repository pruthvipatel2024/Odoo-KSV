from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.schemas.user_schema import UserRegisterSchema, UserLoginSchema, UserResponseSchema, ForgotPasswordSchema
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository
from marshmallow import ValidationError

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

register_schema = UserRegisterSchema()
login_schema = UserLoginSchema()
forgot_schema = ForgotPasswordSchema()
user_response_schema = UserResponseSchema()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        json_data = request.get_json()
        data = register_schema.load(json_data)
        user = AuthService.register_user(data)
        return jsonify({
            "msg": "Registration successful",
            "user": user_response_schema.dump(user)
        }), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        json_data = request.get_json()
        data = login_schema.load(json_data)
        auth_data = AuthService.authenticate_user(data['email'], data['password'])
        if not auth_data:
            return jsonify({"msg": "Invalid email address or password"}), 401
        return jsonify(auth_data), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        json_data = request.get_json()
        data = forgot_schema.load(json_data)
        AuthService.forgot_password(data['email'])
        return jsonify({"msg": "If the email is registered, a password reset link has been dispatched."}), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = UserRepository.get_by_id(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    user_data = user.to_dict()
    if user.role == 'VENDOR' and user.vendor_profile:
        user_data['vendor_id'] = user.vendor_profile.id
        user_data['vendor_status'] = user.vendor_profile.status
        
    return jsonify(user_data), 200
