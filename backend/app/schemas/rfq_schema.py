from marshmallow import Schema, fields, validate
from app.schemas.vendor_schema import VendorResponseSchema

class RFQDocumentSchema(Schema):
    id = fields.Int()
    file_name = fields.Str()
    file_url = fields.Str()
    created_at = fields.DateTime()

class RFQCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=3, max=150))
    description = fields.String(required=False)
    deadline = fields.DateTime(required=True)
    vendor_ids = fields.List(fields.Int(), required=True, validate=validate.Length(min=1))

class RFQUpdateSchema(Schema):
    title = fields.String(required=False, validate=validate.Length(min=3, max=150))
    description = fields.String(required=False)
    deadline = fields.DateTime(required=False)
    status = fields.String(required=False, validate=validate.OneOf(['DRAFT', 'OPEN', 'CLOSED', 'PROCESSED', 'CANCELLED']))
    vendor_ids = fields.List(fields.Int(), required=False)

class RFQResponseSchema(Schema):
    id = fields.Int()
    rfq_number = fields.Str()
    title = fields.Str()
    description = fields.Str(allow_none=True)
    deadline = fields.DateTime()
    status = fields.Str()
    created_by = fields.Int()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    vendors = fields.List(fields.Nested(VendorResponseSchema))
    documents = fields.List(fields.Nested(RFQDocumentSchema))
