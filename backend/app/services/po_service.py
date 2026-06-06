from datetime import datetime
from app.database import db
from app.models.purchase_order import PurchaseOrder
from app.models.quotation import Quotation
from app.models.rfq import RFQ
from app.repositories.purchase_order_repository import PurchaseOrderRepository
from app.repositories.quotation_repository import QuotationRepository
from app.repositories.rfq_repository import RFQRepository
from app.services.audit_service import AuditService
from app.mailer import send_email

class POService:

    @staticmethod
    def get_po_by_id(po_id):
        return PurchaseOrderRepository.get_by_id(po_id)

    @staticmethod
    def list_pos(search_query=None, status=None, vendor_id=None):
        return PurchaseOrderRepository.filter_and_search(search_query, status, vendor_id)

    @staticmethod
    def create_purchase_order(data, current_user_id):
        """
        Creates a new Purchase Order based on a selected Quotation.
        Initial status: PENDING_APPROVAL.
        """
        rfq_id = data['rfq_id']
        quotation_id = data['quotation_id']
        
        rfq = RFQRepository.get_by_id(rfq_id)
        if not rfq:
            raise ValueError("RFQ not found")
            
        quotation = QuotationRepository.get_by_id(quotation_id)
        if not quotation or quotation.rfq_id != rfq_id:
            raise ValueError("Invalid quotation reference for this RFQ")
            
        # Check if PO already exists for this RFQ
        existing_po = PurchaseOrder.query.filter_by(rfq_id=rfq_id).first()
        if existing_po and existing_po.status not in ['REJECTED', 'CANCELLED']:
            raise ValueError(f"A Purchase Order ({existing_po.po_number}) already exists for this RFQ")

        po_number = PurchaseOrderRepository.generate_po_number()
        
        po = PurchaseOrder(
            po_number=po_number,
            rfq_id=rfq_id,
            quotation_id=quotation_id,
            vendor_id=quotation.vendor_id,
            total_amount=quotation.total_price,
            status='PENDING_APPROVAL',
            remarks=data.get('remarks'),
            created_by=current_user_id
        )
        
        db.session.add(po)
        db.session.commit()
        
        # Log approval starting
        AuditService.log_approval(
            entity_type="PO",
            entity_id=po.id,
            status_from=None,
            status_to="PENDING_APPROVAL",
            action_by=current_user_id,
            remarks=data.get('remarks')
        )
        
        AuditService.log_activity(
            user_id=current_user_id,
            action="PO_CREATED",
            details=f"PO {po_number} created in PENDING_APPROVAL based on Quotation {quotation_id}"
        )
        
        return po

    @staticmethod
    def change_po_status(po_id, status, remarks, current_user_id):
        """
        Updates the PO status (Approve, Reject, Send, Complete, Cancel).
        """
        po = PurchaseOrderRepository.get_by_id(po_id)
        if not po:
            raise ValueError("Purchase Order not found")
            
        old_status = po.status
        new_status = status.upper()
        
        if new_status not in ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT', 'COMPLETED', 'CANCELLED']:
            raise ValueError("Invalid PO status value")
            
        po.status = new_status
        if new_status == 'APPROVED':
            po.approved_by = current_user_id
            
            # Automatically accept the winning quotation and reject others
            winning_q = po.quotation
            winning_q.status = 'ACCEPTED'
            
            all_qs = QuotationRepository.get_by_rfq(po.rfq_id)
            for q in all_qs:
                if q.id != winning_q.id:
                    q.status = 'REJECTED'
                    
            # Mark RFQ as PROCESSED
            po.rfq.status = 'PROCESSED'
            
        db.session.commit()
        
        # Log approval trace
        AuditService.log_approval(
            entity_type="PO",
            entity_id=po_id,
            status_from=old_status,
            status_to=new_status,
            action_by=current_user_id,
            remarks=remarks
        )
        
        AuditService.log_activity(
            user_id=current_user_id,
            action=f"PO_STATUS_{new_status}",
            details=f"PO {po.po_number} status updated from {old_status} to {new_status}. Remarks: {remarks}"
        )
        
        # If PO is approved or sent, notify vendor by email
        if new_status in ['APPROVED', 'SENT'] and po.vendor:
            subject = f"[VendorBridge] Purchase Order Awarded: {po.po_number}"
            body = f"""
            <h3>Hello {po.vendor.company_name},</h3>
            <p>We are pleased to inform you that you have been awarded the contract for RFQ: <b>{po.rfq.title}</b>.</p>
            <p><b>Purchase Order Reference:</b> {po.po_number}</p>
            <p><b>Total Award Value:</b> INR {po.total_amount:,.2f}</p>
            <p>Please log in to the portal to review your PO and initiate fulfillment. You may generate your tax invoice once fulfillment is completed.</p>
            <br/>
            <p>Best Regards,</p>
            <p>Procurement Team - VendorBridge</p>
            """
            send_email(po.vendor.contact_email, subject, body)
            
        return po
