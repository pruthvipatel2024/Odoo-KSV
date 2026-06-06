from datetime import datetime
from app.database import db
from app.models.rfq import RFQ
from app.models.quotation import Quotation, QuotationItem
from app.repositories.rfq_repository import RFQRepository
from app.repositories.quotation_repository import QuotationRepository
from app.services.audit_service import AuditService
from app.upload import upload_file

class QuotationService:

    @staticmethod
    def get_quotation_by_id(q_id):
        return QuotationRepository.get_by_id(q_id)

    @staticmethod
    def list_quotations(rfq_id=None, vendor_id=None):
        if rfq_id:
            return QuotationRepository.get_by_rfq(rfq_id)
        if vendor_id:
            return QuotationRepository.get_by_vendor(vendor_id)
        return QuotationRepository.get_all()

    @staticmethod
    def submit_quotation(rfq_id, vendor_id, data, file=None):
        """
        Submits or updates a quotation for an RFQ.
        """
        rfq = RFQRepository.get_by_id(rfq_id)
        if not rfq:
            raise ValueError("RFQ not found")
            
        if rfq.status != 'OPEN' or rfq.deadline < datetime.utcnow():
            raise ValueError("This RFQ is not accepting submissions (either closed or draft)")
            
        # Verify vendor is assigned
        is_assigned = any(v.id == vendor_id for v in rfq.vendors)
        if not is_assigned:
            raise ValueError("Vendor is not assigned to this RFQ")
            
        # Calculate total price and build item list
        items_data = data.get('items', [])
        if not items_data:
            raise ValueError("Quotation must contain at least one item")
            
        calculated_total = 0.0
        items_to_create = []
        for item in items_data:
            qty = int(item['quantity'])
            price = float(item['unit_price'])
            item_total = qty * price
            calculated_total += item_total
            items_to_create.append({
                "item_description": item['item_description'],
                "quantity": qty,
                "unit_price": price,
                "total_price": item_total
            })

        # Handle document attachment
        document_url = data.get('document_url')
        if file:
            upload_res = upload_file(file, folder="quotations")
            if upload_res:
                document_url = upload_res['url']

        # Check if quotation already exists for this vendor and RFQ (support edit/resubmit)
        quotation = QuotationRepository.get_by_rfq_and_vendor(rfq_id, vendor_id)
        is_new = quotation is None
        
        if is_new:
            quotation = Quotation(
                rfq_id=rfq_id,
                vendor_id=vendor_id,
                total_price=calculated_total,
                delivery_lead_time_days=int(data['delivery_lead_time_days']),
                status='SUBMITTED',
                remarks=data.get('remarks'),
                document_url=document_url
            )
            db.session.add(quotation)
        else:
            # Update existing
            quotation.total_price = calculated_total
            quotation.delivery_lead_time_days = int(data['delivery_lead_time_days'])
            quotation.remarks = data.get('remarks')
            if document_url:
                quotation.document_url = document_url
            quotation.status = 'SUBMITTED' # Reset status to submitted if it was revised
            quotation.updated_at = datetime.utcnow()
            
            # Clear old items
            for item in list(quotation.items):
                db.session.delete(item)
                
        db.session.flush() # Secure quotation ID for items
        
        # Add new items
        for item_data in items_to_create:
            q_item = QuotationItem(
                quotation_id=quotation.id,
                **item_data
            )
            db.session.add(q_item)
            
        db.session.commit()
        
        action_name = "QUOTATION_SUBMITTED" if is_new else "QUOTATION_REVISED"
        AuditService.log_activity(
            user_id=None, # Vendor action, could log vendor user ID if mapped
            action=action_name,
            details=f"Vendor ID {vendor_id} submitted/revised bid for RFQ ID {rfq_id}. Amount: {calculated_total}"
        )
        return quotation

    @staticmethod
    def get_comparison_matrix(rfq_id):
        """
        Prepares a side-by-side comparison matrix of all submitted quotations for an RFQ.
        Highlights lowest price, fastest delivery, and best rating.
        """
        rfq = RFQRepository.get_by_id(rfq_id)
        if not rfq:
            raise ValueError("RFQ not found")
            
        quotations = QuotationRepository.get_by_rfq(rfq_id)
        if not quotations:
            return {
                "rfq": rfq.to_dict(),
                "quotations": [],
                "highlights": {}
            }
            
        # Extract numbers for highlights
        lowest_price = min(float(q.total_price) for q in quotations)
        fastest_delivery = min(q.delivery_lead_time_days for q in quotations)
        highest_rating = max(float(q.vendor.rating) for q in quotations if q.vendor)
        
        quotation_list = []
        for q in quotations:
            v_rating = float(q.vendor.rating) if q.vendor else 0.0
            
            q_dict = q.to_dict()
            q_dict["vendor_name"] = q.vendor.company_name if q.vendor else "Unknown Vendor"
            q_dict["vendor_rating"] = v_rating
            
            # Badges
            q_dict["is_lowest_price"] = (float(q.total_price) == lowest_price)
            q_dict["is_fastest_delivery"] = (q.delivery_lead_time_days == fastest_delivery)
            q_dict["is_best_rated"] = (v_rating == highest_rating and highest_rating > 0)
            
            quotation_list.append(q_dict)
            
        return {
            "rfq": rfq.to_dict(),
            "quotations": quotation_list,
            "highlights": {
                "lowest_price": lowest_price,
                "fastest_delivery": fastest_delivery,
                "highest_rating": highest_rating
            }
        }
