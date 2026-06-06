from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.schemas.po_schema import POResponseSchema, POCreateSchema, POUpdateStatusSchema
from app.services.po_service import POService
from app.repositories.vendor_repository import VendorRepository
from app.decorators import role_required
from marshmallow import ValidationError

po_bp = Blueprint('po', __name__, url_prefix='/api/purchase-orders')

po_response = POResponseSchema()
pos_response = POResponseSchema(many=True)
create_schema = POCreateSchema()
status_schema = POUpdateStatusSchema()

@po_bp.route('', methods=['GET'])
@jwt_required()
def list_pos():
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    search = request.args.get('search')
    status = request.args.get('status')
    
    if user_role == 'VENDOR':
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor:
            return jsonify([]), 200
        pos = POService.list_pos(search, status, vendor_id=vendor.id)
    else:
        pos = POService.list_pos(search, status)
        
    return jsonify(pos_response.dump(pos)), 200

@po_bp.route('/<int:po_id>', methods=['GET'])
@jwt_required()
def get_po(po_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    po = POService.get_po_by_id(po_id)
    if not po:
        return jsonify({"msg": "Purchase Order not found"}), 404
        
    # Vendor restriction
    if user_role == 'VENDOR':
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor or po.vendor_id != vendor.id:
            return jsonify({"msg": "Forbidden: Access restricted"}), 403
            
    # Include item list from the associated quotation for visual detail in UI
    po_data = po_response.dump(po)
    if po.quotation:
        po_data['items'] = [item.to_dict() for item in po.quotation.items]
        
    # Include approval timeline details
    from app.services.audit_service import AuditService
    history = AuditService.get_approval_history(entity_type="PO", entity_id=po_id)
    from app.schemas.audit_schema import ApprovalHistorySchema
    po_data['history'] = ApprovalHistorySchema(many=True).dump(history)
    
    return jsonify(po_data), 200

@po_bp.route('', methods=['POST'])
@role_required(['ADMIN', 'PROCUREMENT'])
def create_po():
    user_id = get_jwt_identity()
    try:
        json_data = request.get_json()
        data = create_schema.load(json_data)
        po = POService.create_purchase_order(data, int(user_id))
        return jsonify(po_response.dump(po)), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400

@po_bp.route('/<int:po_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def change_po_status(po_id):
    user_id = get_jwt_identity()
    try:
        json_data = request.get_json()
        data = status_schema.load(json_data)
        po = POService.change_po_status(po_id, data['status'], data.get('remarks', ''), int(user_id))
        return jsonify(po_response.dump(po)), 200
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400
