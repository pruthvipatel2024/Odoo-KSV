from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.schemas.vendor_schema import VendorResponseSchema, VendorUpdateSchema
from app.services.vendor_service import VendorService
from app.decorators import role_required
from marshmallow import ValidationError

vendor_bp = Blueprint('vendor', __name__, url_prefix='/api/vendors')

vendor_schema = VendorResponseSchema()
vendors_schema = VendorResponseSchema(many=True)
update_schema = VendorUpdateSchema()

@vendor_bp.route('', methods=['GET'])
@role_required(['ADMIN', 'PROCUREMENT', 'MANAGER'])
def list_vendors():
    search = request.args.get('search')
    status = request.args.get('status')
    vendors = VendorService.list_vendors(search, status)
    return jsonify(vendors_schema.dump(vendors)), 200

@vendor_bp.route('/<int:vendor_id>', methods=['GET'])
@jwt_required()
def get_vendor(vendor_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    vendor = VendorService.get_vendor_by_id(vendor_id)
    if not vendor:
        return jsonify({"msg": "Vendor not found"}), 404
        
    # Vendor role can only see their own profile
    if user_role == 'VENDOR' and str(vendor.user_id) != str(user_id):
        return jsonify({"msg": "Forbidden: Access to this profile is restricted"}), 403
        
    return jsonify(vendor_schema.dump(vendor)), 200

@vendor_bp.route('/<int:vendor_id>', methods=['PUT'])
@jwt_required()
def update_vendor(vendor_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    vendor = VendorService.get_vendor_by_id(vendor_id)
    if not vendor:
        return jsonify({"msg": "Vendor not found"}), 404
        
    # Security: vendor can only update their own profile; admins can update any
    if user_role == 'VENDOR' and str(vendor.user_id) != str(user_id):
        return jsonify({"msg": "Forbidden: Access restricted"}), 403
        
    try:
        json_data = request.get_json()
        data = update_schema.load(json_data)
        
        # Prevent non-admin users from updating vendor status or rating directly
        if user_role != 'ADMIN':
            data.pop('status', None)
            data.pop('rating', None)
            
        updated = VendorService.update_vendor_profile(vendor_id, data, int(user_id))
        return jsonify(vendor_schema.dump(updated)), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400

@vendor_bp.route('/<int:vendor_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def change_vendor_status(vendor_id):
    user_id = get_jwt_identity()
    try:
        json_data = request.get_json()
        status = json_data.get('status')
        remarks = json_data.get('remarks', '')
        
        if not status:
            return jsonify({"msg": "Status is a required field"}), 400
            
        updated = VendorService.change_vendor_status(vendor_id, status, remarks, int(user_id))
        return jsonify(vendor_schema.dump(updated)), 200
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400
