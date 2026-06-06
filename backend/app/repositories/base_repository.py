from app.database import db

class BaseRepository:
    model = None

    @classmethod
    def get_by_id(cls, id):
        return db.session.get(cls.model, id)

    @classmethod
    def get_all(cls):
        return cls.model.query.all()

    @classmethod
    def create(cls, **kwargs):
        instance = cls.model(**kwargs)
        return cls.save(instance)

    @classmethod
    def save(cls, instance):
        db.session.add(instance)
        db.session.commit()
        return instance

    @classmethod
    def delete(cls, instance):
        db.session.delete(instance)
        db.session.commit()
        return True

    @classmethod
    def update(cls, instance, **kwargs):
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        db.session.commit()
        return instance
