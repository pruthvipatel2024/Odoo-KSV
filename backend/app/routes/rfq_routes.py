from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.schemas.rfq_schema import RFQResponseSchema, RFQCreateSchema, RFQDocumentSchema
from app.services.rfq_service import RFQService
from app.decorators import role_required
from marshmallow import ValidationError

rfq_bp = Blueprint('rfq', __name__, url_prefix='/api/rfqs')

rfq_schema = RFQResponseSchema()
rfqs_schema = RFQResponseSchema(many=True)
create_schema = RFQCreateSchema()
doc_schema = RFQDocumentSchema()

@rfq_bp.route('', methods=['GET'])
@jwt_required()
def list_rfqs():
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    search = request.args.get('search')
    status = request.args.get('status')
    
    # If role is VENDOR, restrict results to RFQs assigned to them
    if user_role == 'VENDOR':
        # Retrieve vendor profile ID associated with current user
        from app.repositories.vendor_repository import VendorRepository
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor:
            return jsonify([]), 200
        rfqs = RFQService.list_rfqs(search, status, vendor_id=vendor.id)
    else:
        # Internal roles (Procurement, Manager, Admin) see all
        rfqs = RFQService.list_rfqs(search, status)
        
    return jsonify(rfqs_schema.dump(rfqs)), 200

@rfq_bp.route('/<int:rfq_id>', methods=['GET'])
@jwt_required()
def get_rfq(rfq_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    rfq = RFQService.get_rfq_by_id(rfq_id)
    if not rfq:
        return jsonify({"msg": "RFQ not found"}), 404
        
    # Vendor safety: check if vendor is assigned to this RFQ
    if user_role == 'VENDOR':
        from app.repositories.vendor_repository import VendorRepository
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor or not any(v.id == vendor.id for v in rfq.vendors):
            return jsonify({"msg": "Forbidden: RFQ details restricted"}), 403
            
    return jsonify(rfq_schema.dump(rfq)), 200

@rfq_bp.route('', methods=['POST'])
@role_required(['ADMIN', 'PROCUREMENT'])
def create_rfq():
    user_id = get_jwt_identity()
    try:
        json_data = request.get_json()
        data = create_schema.load(json_data)
        rfq = RFQService.create_rfq(data, int(user_id))
        return jsonify(rfq_schema.dump(rfq)), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400

@rfq_bp.route('/<int:rfq_id>/documents', methods=['POST'])
@role_required(['ADMIN', 'PROCUREMENT'])
def upload_document(rfq_id):
    user_id = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({"msg": "No file part in request"}), 400
        
    file = request.files['file']
    try:
        doc = RFQService.attach_document_to_rfq(rfq_id, file, int(user_id))
        return jsonify(doc_schema.dump(doc)), 201
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400
