from datetime import datetime
from app.models.purchase_order import PurchaseOrder
from app.repositories.base_repository import BaseRepository

class PurchaseOrderRepository(BaseRepository):
    model = PurchaseOrder

    @classmethod
    def get_by_number(cls, po_number):
        return cls.model.query.filter_by(po_number=po_number).first()

    @classmethod
    def generate_po_number(cls):
        year = datetime.utcnow().strftime("%Y")
        prefix = f"PO-{year}-"
        
        # Find latest PO for this year
        latest = cls.model.query.filter(cls.model.po_number.like(f"{prefix}%"))\
                               .order_by(cls.model.id.desc()).first()
                               
        if latest:
            try:
                seq = int(latest.po_number.split("-")[-1])
                new_seq = seq + 1
            except ValueError:
                new_seq = 1
        else:
            new_seq = 1
            
        return f"{prefix}{new_seq:04d}"

    @classmethod
    def filter_and_search(cls, search_query=None, status=None, vendor_id=None):
        query = cls.model.query
        
        if status:
            query = query.filter_by(status=status)
            
        if vendor_id:
            query = query.filter_by(vendor_id=vendor_id)
            
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(cls.model.po_number.like(search_pattern))
            
        return query.order_by(cls.model.created_at.desc()).all()
