from marshmallow import Schema, fields, validate
from app.schemas.vendor_schema import VendorResponseSchema

class QuotationItemSchema(Schema):
    id = fields.Int(dump_only=True)
    item_description = fields.String(required=True, validate=validate.Length(min=1, max=255))
    quantity = fields.Integer(required=True, validate=validate.Range(min=1))
    unit_price = fields.Float(required=True, validate=validate.Range(min=0.01))
    total_price = fields.Float(dump_only=True)

class QuotationSubmitSchema(Schema):
    items = fields.List(fields.Nested(QuotationItemSchema), required=True, validate=validate.Length(min=1))
    delivery_lead_time_days = fields.Integer(required=True, validate=validate.Range(min=1))
    remarks = fields.String(required=False)
    document_url = fields.String(required=False, allow_none=True)

class QuotationResponseSchema(Schema):
    id = fields.Int()
    rfq_id = fields.Int()
    vendor_id = fields.Int()
    total_price = fields.Float()
    delivery_lead_time_days = fields.Int()
    status = fields.Str()
    remarks = fields.Str(allow_none=True)
    document_url = fields.Str(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    items = fields.List(fields.Nested(QuotationItemSchema))
    vendor = fields.Nested(VendorResponseSchema, dump_only=True)
