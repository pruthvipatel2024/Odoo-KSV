from marshmallow import Schema, fields, validate
from app.schemas.vendor_schema import VendorResponseSchema

class POCreateSchema(Schema):
    rfq_id = fields.Integer(required=True)
    quotation_id = fields.Integer(required=True)
    remarks = fields.String(required=False)

class POUpdateStatusSchema(Schema):
    status = fields.String(required=True, validate=validate.OneOf(['APPROVED', 'REJECTED', 'SENT', 'COMPLETED', 'CANCELLED']))
    remarks = fields.String(required=False)

class POResponseSchema(Schema):
    id = fields.Int()
    po_number = fields.Str()
    rfq_id = fields.Int()
    quotation_id = fields.Int()
    vendor_id = fields.Int()
    total_amount = fields.Float()
    status = fields.Str()
    remarks = fields.Str(allow_none=True)
    created_by = fields.Int()
    approved_by = fields.Int(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    vendor = fields.Nested(VendorResponseSchema, dump_only=True)
