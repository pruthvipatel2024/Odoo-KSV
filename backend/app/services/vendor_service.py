from app.database import db
from app.repositories.vendor_repository import VendorRepository
from app.services.audit_service import AuditService

class VendorService:

    @staticmethod
    def get_vendor_by_id(vendor_id):
        return VendorRepository.get_by_id(vendor_id)

    @staticmethod
    def list_vendors(search_query=None, status=None):
        return VendorRepository.filter_and_search(search_query, status)

    @staticmethod
    def update_vendor_profile(vendor_id, data, current_user_id):
        vendor = VendorRepository.get_by_id(vendor_id)
        if not vendor:
            raise ValueError("Vendor profile not found")
            
        # Update fields
        vendor = VendorRepository.update(vendor, **data)
        
        AuditService.log_activity(
            user_id=current_user_id,
            action="VENDOR_PROFILE_UPDATED",
            details=f"Vendor ID {vendor_id} profile updated: {data}"
        )
        return vendor

    @staticmethod
    def change_vendor_status(vendor_id, status, remarks, current_user_id):
        """
        Allows Admins/Managers to Approve, Reject, or Blacklist a Vendor
        """
        vendor = VendorRepository.get_by_id(vendor_id)
        if not vendor:
            raise ValueError("Vendor profile not found")
            
        old_status = vendor.status
        new_status = status.upper()
        
        if new_status not in ['PENDING', 'APPROVED', 'REJECTED', 'BLACKLISTED']:
            raise ValueError("Invalid status value")
            
        vendor.status = new_status
        db.session.commit()
        
        # Log approval transition
        AuditService.log_approval(
            entity_type="VENDOR",
            entity_id=vendor_id,
            status_from=old_status,
            status_to=new_status,
            action_by=current_user_id,
            remarks=remarks
        )
        
        # Log general system log
        AuditService.log_activity(
            user_id=current_user_id,
            action=f"VENDOR_STATUS_{new_status}",
            details=f"Vendor ID {vendor_id} status changed from {old_status} to {new_status}. Remarks: {remarks}"
        )
        
        return vendor
