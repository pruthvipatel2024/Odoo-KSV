from app.models.vendor import VendorProfile
from app.repositories.base_repository import BaseRepository
from sqlalchemy import or_

class VendorRepository(BaseRepository):
    model = VendorProfile

    @classmethod
    def get_by_gst(cls, gst_number):
        return cls.model.query.filter_by(gst_number=gst_number).first()

    @classmethod
    def get_by_user_id(cls, user_id):
        return cls.model.query.filter_by(user_id=user_id).first()

    @classmethod
    def filter_and_search(cls, search_query=None, status=None):
        query = cls.model.query
        
        if status:
            query = query.filter_by(status=status)
            
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    cls.model.company_name.like(search_pattern),
                    cls.model.gst_number.like(search_pattern),
                    cls.model.contact_email.like(search_pattern)
                )
            )
            
        return query.all()
