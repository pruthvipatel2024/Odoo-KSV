from app.models.invoice import Invoice
from app.repositories.base_repository import BaseRepository

class InvoiceRepository(BaseRepository):
    model = Invoice

    @classmethod
    def get_by_number(cls, invoice_number):
        return cls.model.query.filter_by(invoice_number=invoice_number).first()

    @classmethod
    def filter_and_search(cls, search_query=None, status=None, vendor_id=None):
        query = cls.model.query
        
        if status:
            query = query.filter_by(status=status)
            
        if vendor_id:
            query = query.filter_by(vendor_id=vendor_id)
            
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(cls.model.invoice_number.like(search_pattern))
            
        return query.order_by(cls.model.created_at.desc()).all()
