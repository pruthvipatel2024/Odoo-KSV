import os
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.schemas.invoice_schema import InvoiceResponseSchema, InvoiceCreateSchema
from app.services.invoice_service import InvoiceService
from app.repositories.vendor_repository import VendorRepository
from app.decorators import role_required
from marshmallow import ValidationError

invoice_bp = Blueprint('invoice', __name__, url_prefix='/api/invoices')

invoice_response = InvoiceResponseSchema()
invoices_response = InvoiceResponseSchema(many=True)
create_schema = InvoiceCreateSchema()

@invoice_bp.route('', methods=['GET'])
@jwt_required()
def list_invoices():
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    search = request.args.get('search')
    status = request.args.get('status')
    
    if user_role == 'VENDOR':
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor:
            return jsonify([]), 200
        invoices = InvoiceService.list_invoices(search, status, vendor_id=vendor.id)
    else:
        invoices = InvoiceService.list_invoices(search, status)
        
    return jsonify(invoices_response.dump(invoices)), 200

@invoice_bp.route('/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    invoice = InvoiceService.get_invoice_by_id(invoice_id)
    if not invoice:
        return jsonify({"msg": "Invoice not found"}), 404
        
    # Vendor restriction
    if user_role == 'VENDOR':
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor or invoice.vendor_id != vendor.id:
            return jsonify({"msg": "Forbidden: Access restricted"}), 403
            
    # Include item list from PO/Quotation for UI presentation
    invoice_data = invoice_response.dump(invoice)
    po = invoice.purchase_order
    if po:
        invoice_data['po_number'] = po.po_number
        if po.quotation:
            invoice_data['items'] = [item.to_dict() for item in po.quotation.items]
            
    return jsonify(invoice_data), 200

@invoice_bp.route('/<int:invoice_id>/download', methods=['GET'])
@jwt_required()
def download_invoice(invoice_id):
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    invoice = InvoiceService.get_invoice_by_id(invoice_id)
    if not invoice:
        return jsonify({"msg": "Invoice not found"}), 404
        
    if user_role == 'VENDOR':
        vendor = VendorRepository.get_by_user_id(int(user_id))
        if not vendor or invoice.vendor_id != vendor.id:
            return jsonify({"msg": "Forbidden: Access restricted"}), 403
            
    # Locate file on disk
    if not invoice.pdf_url:
        return jsonify({"msg": "PDF copy has not been generated for this invoice"}), 400
        
    file_name = os.path.basename(invoice.pdf_url)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'invoices', file_name)
    
    if not os.path.exists(file_path):
        # Regenerate if file went missing on disk
        try:
            from app.pdf_generator import generate_invoice_pdf
            po = invoice.purchase_order
            pdf_buffer = generate_invoice_pdf(invoice, po, po.vendor)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as f:
                f.write(pdf_buffer.getvalue())
        except Exception as e:
            return jsonify({"msg": f"PDF file not found on disk and failed to regenerate: {e}"}), 404
            
    return send_file(
        file_path,
        mimetype='application/pdf',
        as_attachment=False, # Display in browser tab so they can print directly
        download_name=f"invoice_{invoice.invoice_number}.pdf"
    )

@invoice_bp.route('', methods=['POST'])
@role_required(['VENDOR'])
def create_invoice():
    user_id = get_jwt_identity()
    vendor = VendorRepository.get_by_user_id(int(user_id))
    if not vendor:
        return jsonify({"msg": "Vendor profile not found for your account"}), 400
        
    if vendor.status != 'APPROVED':
        return jsonify({"msg": "Forbidden: Approved vendor profiles only"}), 403
        
    try:
        json_data = request.get_json()
        data = create_schema.load(json_data)
        invoice = InvoiceService.create_invoice(data, vendor.id, int(user_id))
        return jsonify(invoice_response.dump(invoice)), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400

@invoice_bp.route('/<int:invoice_id>/pay', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def pay_invoice(invoice_id):
    user_id = get_jwt_identity()
    try:
        invoice = InvoiceService.pay_invoice(invoice_id, int(user_id))
        return jsonify(invoice_response.dump(invoice)), 200
    except ValueError as err:
        return jsonify({"msg": str(err)}), 400
