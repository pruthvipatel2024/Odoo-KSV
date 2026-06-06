import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.schemas.quotation_schema import QuotationResponseSchema, QuotationSubmitSchema
from app.services.quotation_service import QuotationService
from app.repositories.vendor_repository import VendorRepository
from app.decorators import role_required
from marshmallow import ValidationError

quotation_bp = Blueprint('quotation', __name__, url_prefix='/api')

q_response = QuotationResponseSchema()
qs_response = QuotationResponseSchema(many=True)
q_submit = QuotationSubmitSchema()

@quotation_bp.route('/quotations', methods=['GET'])
@jwt_required()
def list_quotations():
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    rfq_id = request.args.get('rfq_id')
    if rfq_id:
        rfq_id = int(rfq_id)
        
    if user_role == 'VENDOR':
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor:
            return jsonify([]), 200
        # Vendor can only query their own submissions
        quotations = QuotationService.list_quotations(rfq_id=rfq_id, vendor_id=vendor.id)
    else:
        # Procurement/Managers see all quotations for an RFQ
        if not rfq_id:
            return jsonify({"msg": "rfq_id query parameter is required for internal roles"}), 400
        quotations = QuotationService.list_quotations(rfq_id=rfq_id)
        
    return jsonify(qs_response.dump(quotations)), 200

@quotation_bp.route('/quotations/<int:q_id>', methods=['GET'])
@jwt_required()
def get_quotation(q_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    quotation = QuotationService.get_quotation_by_id(q_id)
    if not quotation:
        return jsonify({"msg": "Quotation not found"}), 404
        
    if user_role == 'VENDOR':
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor or quotation.vendor_id != vendor.id:
            return jsonify({"msg": "Forbidden: Access restricted"}), 403
            
    return jsonify(q_response.dump(quotation)), 200

@quotation_bp.route('/rfqs/<int:rfq_id>/quotations', methods=['POST'])
@role_required(['VENDOR'])
def submit_quotation(rfq_id):
    user_id = get_jwt_identity()
    vendor = VendorRepository.get_by_user_id(int(user_id))
    if not vendor:
        return jsonify({"msg": "Vendor profile not found for your account"}), 400
        
    if vendor.status != 'APPROVED':
        return jsonify({"msg": "Forbidden: Your vendor account must be approved to submit quotes"}), 403
        
    # Support multipart/form-data for document attachments
    file = request.files.get('file')
    
    try:
        # Parse fields from form
        if request.form:
            items_raw = request.form.get('items')
            items_list = json.loads(items_raw) if items_raw else []
            data_payload = {
                "items": items_list,
                "delivery_lead_time_days": request.form.get('delivery_lead_time_days'),
                "remarks": request.form.get('remarks')
            }
        else:
            data_payload = request.get_json()
            
        data = q_submit.load(data_payload)
        
        quotation = QuotationService.submit_quotation(rfq_id, vendor.id, data, file)
        return jsonify(q_response.dump(quotation)), 201
    except (ValidationError, json.JSONDecodeError) as err:
        msg = err.messages if hasattr(err, 'messages') else "Invalid JSON items list"
        return jsonify({"errors": msg}), 400
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400

@quotation_bp.route('/rfqs/<int:rfq_id>/compare', methods=['GET'])
@role_required(['ADMIN', 'PROCUREMENT', 'MANAGER'])
def compare_quotations(rfq_id):
    try:
        matrix = QuotationService.get_comparison_matrix(rfq_id)
        return jsonify(matrix), 200
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400
