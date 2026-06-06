from app.models.quotation import Quotation
from app.repositories.base_repository import BaseRepository

class QuotationRepository(BaseRepository):
    model = Quotation

    @classmethod
    def get_by_rfq_and_vendor(cls, rfq_id, vendor_id):
        return cls.model.query.filter_by(rfq_id=rfq_id, vendor_id=vendor_id).first()

    @classmethod
    def get_by_rfq(cls, rfq_id):
        return cls.model.query.filter_by(rfq_id=rfq_id).order_by(cls.model.total_price.asc()).all()

    @classmethod
    def get_by_vendor(cls, vendor_id):
        return cls.model.query.filter_by(vendor_id=vendor_id).order_by(cls.model.created_at.desc()).all()
