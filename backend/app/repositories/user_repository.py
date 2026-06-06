from app.models.user import User
from app.repositories.base_repository import BaseRepository

class UserRepository(BaseRepository):
    model = User

    @classmethod
    def get_by_email(cls, email):
        return cls.model.query.filter_by(email=email).first()
