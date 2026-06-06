from datetime import datetime
from app.models.rfq import RFQ
from app.repositories.base_repository import BaseRepository
from sqlalchemy import or_

class RFQRepository(BaseRepository):
    model = RFQ

    @classmethod
    def get_by_number(cls, rfq_number):
        return cls.model.query.filter_by(rfq_number=rfq_number).first()

    @classmethod
    def generate_rfq_number(cls):
        # Generates unique RFQ-YYYY-XXXX number
        year = datetime.utcnow().strftime("%Y")
        prefix = f"RFQ-{year}-"
        
        # Find latest RFQ for this year
        latest = cls.model.query.filter(cls.model.rfq_number.like(f"{prefix}%"))\
                               .order_by(cls.model.id.desc()).first()
                               
        if latest:
            try:
                # Extract sequence number
                seq = int(latest.rfq_number.split("-")[-1])
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
            # Filter RFQs where vendor is assigned
            query = query.filter(cls.model.vendors.any(id=vendor_id))
            
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    cls.model.title.like(search_pattern),
                    cls.model.rfq_number.like(search_pattern),
                    cls.model.description.like(search_pattern)
                )
            )
            
        return query.order_by(cls.model.created_at.desc()).all()
