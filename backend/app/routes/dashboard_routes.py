from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models.user import User
from app.models.vendor import VendorProfile
from app.models.rfq import RFQ
from app.models.purchase_order import PurchaseOrder
from app.models.invoice import Invoice
from app.services.audit_service import AuditService
from app.schemas.audit_schema import ActivityLogSchema
from app.decorators import role_required
from app.database import db
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    claims = get_jwt()
    user_id = get_jwt_identity()
    user_role = claims.get('role')
    
    # Base KPI defaults
    total_spend = 0.0
    pending_rfqs = 0
    total_vendors = 0
    awaiting_approvals = 0
    
    spending_trend = []
    vendor_ratings = []
    rfq_trends = []
    
    # Retrieve vendor profile if user is vendor
    vendor = None
    if user_role == 'VENDOR':
        from app.repositories.vendor_repository import VendorRepository
        vendor = VendorRepository.get_by_user_id(int(user_id))
        
    # --- CALCULATE METRICS ---
    if user_role != 'VENDOR':
        # 1. Total Spend (Sum of APPROVED/SENT/COMPLETED POs)
        spend_res = db.session.query(func.sum(PurchaseOrder.total_amount))\
                              .filter(PurchaseOrder.status.in_(['APPROVED', 'SENT', 'COMPLETED'])).scalar()
        total_spend = float(spend_res) if spend_res else 0.0
        
        # 2. Open RFQs
        pending_rfqs = RFQ.query.filter_by(status='OPEN').count()
        
        # 3. Total Approved Vendors
        total_vendors = VendorProfile.query.filter_by(status='APPROVED').count()
        
        # 4. Awaiting Approvals (POs in PENDING_APPROVAL)
        awaiting_approvals = PurchaseOrder.query.filter_by(status='PENDING_APPROVAL').count()
        
        # 5. Monthly Spend Trend (last 6 months)
        # Use SQLite strftime or MySQL depending on DB
        # Standard code that works across both: query and group in Python or SQLite syntax.
        # Let's write a simple query and format in Python to be fully cross-database compatible!
        po_records = db.session.query(PurchaseOrder.created_at, PurchaseOrder.total_amount)\
                               .filter(PurchaseOrder.status.in_(['APPROVED', 'SENT', 'COMPLETED'])).all()
        trend_map = {}
        for rec in po_records:
            month_key = rec.created_at.strftime("%Y-%m")
            trend_map[month_key] = trend_map.get(month_key, 0.0) + float(rec.total_amount)
            
        # Sort months
        sorted_months = sorted(trend_map.keys())[-6:]
        spending_trend = [{"month": m, "amount": trend_map[m]} for m in sorted_months]
        
        # 6. Vendor performance ratings (highest rated vendors)
        top_vendors = VendorProfile.query.filter_by(status='APPROVED').order_by(VendorProfile.rating.desc()).limit(5).all()
        vendor_ratings = [{"company_name": v.company_name, "rating": float(v.rating)} for v in top_vendors]
        
        # 7. RFQ Status Trend
        rfq_statuses = db.session.query(RFQ.status, func.count(RFQ.id)).group_by(RFQ.status).all()
        rfq_trends = [{"status": status, "count": count} for status, count in rfq_statuses]
        
    else:
        # Vendor Scoped metrics
        if vendor:
            # Spend (Total value of approved POs awarded to them)
            spend_res = db.session.query(func.sum(PurchaseOrder.total_amount))\
                                  .filter(PurchaseOrder.vendor_id == vendor.id, 
                                          PurchaseOrder.status.in_(['APPROVED', 'SENT', 'COMPLETED'])).scalar()
            total_spend = float(spend_res) if spend_res else 0.0
            
            # Invited RFQs (Count of assigned OPEN RFQs)
            pending_rfqs = RFQ.query.filter(RFQ.status == 'OPEN', RFQ.vendors.any(id=vendor.id)).count()
            
            # Active Quotations (Count of quotations submitted)
            from app.models.quotation import Quotation
            total_vendors = Quotation.query.filter_by(vendor_id=vendor.id).count() # Rename KPI to "Submissions"
            
            # Pending POs (POs in PENDING_APPROVAL or SENT)
            awaiting_approvals = PurchaseOrder.query.filter_by(vendor_id=vendor.id, status='SENT').count()
            
            # Vendor Monthly Spend Trend
            po_records = db.session.query(PurchaseOrder.created_at, PurchaseOrder.total_amount)\
                                   .filter(PurchaseOrder.vendor_id == vendor.id, 
                                           PurchaseOrder.status.in_(['APPROVED', 'SENT', 'COMPLETED'])).all()
            trend_map = {}
            for rec in po_records:
                month_key = rec.created_at.strftime("%Y-%m")
                trend_map[month_key] = trend_map.get(month_key, 0.0) + float(rec.total_amount)
            sorted_months = sorted(trend_map.keys())[-6:]
            spending_trend = [{"month": m, "amount": trend_map[m]} for m in sorted_months]
            
            # Add rating to payload
            vendor_ratings = [{"company_name": vendor.company_name, "rating": float(vendor.rating)}]
            
            # RFQ Status scoping
            rfq_trends = [
                {"status": "INVITED", "count": pending_rfqs},
                {"status": "SUBMITTED", "count": total_vendors}
            ]

    # Fill default curves if trend is empty (so dashboard doesn't look blank)
    if not spending_trend:
        current_month = db.func.current_date() # dummy placeholder
        spending_trend = [{"month": "2026-06", "amount": 0.0}]
        
    return jsonify({
        "summary": {
            "total_spend": total_spend,
            "pending_rfqs": pending_rfqs,
            "total_vendors": total_vendors, # Represent active vendors for admin, active submissions for vendor
            "awaiting_approvals": awaiting_approvals
        },
        "charts": {
            "spending_trend": spending_trend,
            "vendor_ratings": vendor_ratings,
            "rfq_trends": rfq_trends
        }
    }), 200

@dashboard_bp.route('/logs', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'PROCUREMENT'])
def get_logs():
    logs = AuditService.get_activity_logs(limit=50)
    schema = ActivityLogSchema(many=True)
    return jsonify(schema.dump(logs)), 200
