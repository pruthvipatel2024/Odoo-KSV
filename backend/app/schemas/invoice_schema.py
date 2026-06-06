from marshmallow import Schema, fields, validate
from app.schemas.vendor_schema import VendorResponseSchema

class InvoiceCreateSchema(Schema):
    po_id = fields.Integer(required=True)
    invoice_number = fields.String(required=True, validate=validate.Length(min=3, max=50))
    invoice_date = fields.Date(required=True)
    gst_rate = fields.Float(required=False, validate=validate.Range(min=0.0, max=100.0))

class InvoiceResponseSchema(Schema):
    id = fields.Int()
    po_id = fields.Int()
    invoice_number = fields.Str()
    vendor_id = fields.Int()
    subtotal = fields.Float()
    gst_rate = fields.Float()
    gst_amount = fields.Float()
    total_amount = fields.Float()
    status = fields.Str()
    invoice_date = fields.Date()
    pdf_url = fields.Str(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    vendor = fields.Nested(VendorResponseSchema, dump_only=True)
