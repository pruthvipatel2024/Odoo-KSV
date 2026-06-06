import csv
import io
from flask import Blueprint, jsonify, Response, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.decorators import role_required
from app.database import db
from app.models.vendor import VendorProfile
from app.models.rfq import RFQ
from app.models.quotation import Quotation
from app.models.purchase_order import PurchaseOrder
from app.models.invoice import Invoice

report_bp = Blueprint('reports', __name__)


@report_bp.route('/api/reports/vendors', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'MANAGER', 'PROCUREMENT'])
def export_vendors():
    """Export vendors as CSV."""
    vendors = VendorProfile.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Company Name', 'GST Number', 'Category', 'Contact Email', 'Phone', 'Status', 'Rating', 'Created At'])
    for v in vendors:
        writer.writerow([
            v.id, v.company_name, v.gst_number, v.category or '',
            v.contact_email, v.contact_phone or '', v.status,
            float(v.rating), v.created_at.strftime('%Y-%m-%d')
        ])
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=vendors_report.csv'}
    )


@report_bp.route('/api/reports/purchase-orders', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'MANAGER', 'PROCUREMENT'])
def export_purchase_orders():
    """Export Purchase Orders as CSV."""
    pos = PurchaseOrder.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['PO Number', 'RFQ ID', 'Vendor ID', 'Total Amount', 'Status', 'Created By', 'Created At'])
    for po in pos:
        writer.writerow([
            po.po_number, po.rfq_id, po.vendor_id,
            float(po.total_amount), po.status,
            po.created_by, po.created_at.strftime('%Y-%m-%d')
        ])
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=purchase_orders_report.csv'}
    )


@report_bp.route('/api/reports/invoices', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'MANAGER', 'PROCUREMENT'])
def export_invoices():
    """Export Invoices as CSV."""
    invoices = Invoice.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Invoice Number', 'PO ID', 'Vendor ID', 'Invoice Date', 'Total Amount', 'Status'])
    for inv in invoices:
        writer.writerow([
            inv.invoice_number, inv.purchase_order_id, inv.vendor_id,
            inv.invoice_date.strftime('%Y-%m-%d') if inv.invoice_date else '',
            float(inv.total_amount), inv.status
        ])
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=invoices_report.csv'}
    )


@report_bp.route('/api/reports/rfqs', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'MANAGER', 'PROCUREMENT'])
def export_rfqs():
    """Export RFQs as CSV."""
    rfqs = RFQ.query.all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['RFQ Number', 'Title', 'Status', 'Deadline', 'Created By', 'Created At'])
    for rfq in rfqs:
        writer.writerow([
            rfq.rfq_number, rfq.title, rfq.status,
            rfq.deadline.strftime('%Y-%m-%d'),
            rfq.created_by, rfq.created_at.strftime('%Y-%m-%d')
        ])
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=rfqs_report.csv'}
    )
