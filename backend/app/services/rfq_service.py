from datetime import datetime
from app.database import db
from app.models.rfq import RFQ, RFQDocument
from app.repositories.rfq_repository import RFQRepository
from app.repositories.vendor_repository import VendorRepository
from app.services.audit_service import AuditService
from app.upload import upload_file
from app.mailer import send_email

class RFQService:

    @staticmethod
    def get_rfq_by_id(rfq_id):
        return RFQRepository.get_by_id(rfq_id)

    @staticmethod
    def list_rfqs(search_query=None, status=None, vendor_id=None):
        # Auto-close expired RFQs first to keep data current
        RFQService.check_and_close_expired_rfqs()
        return RFQRepository.filter_and_search(search_query, status, vendor_id)

    @staticmethod
    def create_rfq(data, current_user_id):
        """
        Creates a new RFQ and assigns multiple vendors
        """
        rfq_number = RFQRepository.generate_rfq_number()
        
        # Resolve vendor profiles
        vendor_ids = data.get('vendor_ids', [])
        vendors = []
        for v_id in vendor_ids:
            vendor = VendorRepository.get_by_id(v_id)
            if vendor:
                vendors.append(vendor)
                
        if not vendors:
            raise ValueError("RFQ must be assigned to at least one valid vendor")

        deadline_str = data['deadline']
        # Parse datetime from ISO string
        if isinstance(deadline_str, str):
            # Try to handle timezone offset if present (e.g. Z or +05:30)
            cleaned_str = deadline_str.replace("Z", "")
            if "+" in cleaned_str:
                cleaned_str = cleaned_str.split("+")[0]
            deadline = datetime.fromisoformat(cleaned_str)
        else:
            deadline = deadline_str
            
        if deadline <= datetime.utcnow():
            raise ValueError("RFQ deadline must be in the future")

        rfq = RFQ(
            rfq_number=rfq_number,
            title=data['title'],
            description=data.get('description'),
            deadline=deadline,
            status='OPEN', # Set immediately to OPEN to let vendors see it
            created_by=current_user_id
        )
        
        # Associate vendors
        rfq.vendors.extend(vendors)
        db.session.add(rfq)
        db.session.commit()
        
        # Log action
        AuditService.log_activity(
            user_id=current_user_id,
            action="RFQ_CREATED",
            details=f"RFQ {rfq_number} created with {len(vendors)} assigned vendors."
        )
        
        # Send Email notification to each vendor
        for vendor in vendors:
            subject = f"[VendorBridge] New RFQ Invitation: {rfq_number}"
            body = f"""
            <h3>Hello {vendor.company_name},</h3>
            <p>You have been invited to submit a quotation for RFQ: <b>{rfq.title} ({rfq_number})</b>.</p>
            <p><b>Description:</b> {rfq.description or 'No description provided'}</p>
            <p><b>Deadline:</b> {rfq.deadline.strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
            <p>Please log in to the VendorBridge portal to submit your quotation before the deadline.</p>
            <br/>
            <p>Best Regards,</p>
            <p>Procurement Team - VendorBridge</p>
            """
            send_email(vendor.contact_email, subject, body)
            
        return rfq

    @staticmethod
    def attach_document_to_rfq(rfq_id, file, current_user_id):
        rfq = RFQRepository.get_by_id(rfq_id)
        if not rfq:
            raise ValueError("RFQ not found")
            
        upload_result = upload_file(file, folder="rfqs")
        if not upload_result:
            raise ValueError("File upload failed")
            
        doc = RFQDocument(
            rfq_id=rfq_id,
            file_name=upload_result['filename'],
            file_url=upload_result['url']
        )
        db.session.add(doc)
        db.session.commit()
        
        AuditService.log_activity(
            user_id=current_user_id,
            action="RFQ_DOCUMENT_ATTACHED",
            details=f"Document '{doc.file_name}' attached to RFQ ID {rfq_id}"
        )
        return doc

    @staticmethod
    def check_and_close_expired_rfqs():
        """
        Scans for open RFQs where deadline has passed and updates status to CLOSED
        """
        now = datetime.utcnow()
        expired_rfqs = RFQ.query.filter(RFQ.status == 'OPEN', RFQ.deadline < now).all()
        for rfq in expired_rfqs:
            rfq.status = 'CLOSED'
            AuditService.log_activity(
                user_id=None,
                action="RFQ_AUTO_CLOSED",
                details=f"RFQ {rfq.rfq_number} deadline passed. Automatically closed."
            )
        if expired_rfqs:
            db.session.commit()
