from marshmallow import Schema, fields, validate

class VendorCreateSchema(Schema):
    company_name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    gst_number = fields.String(required=True, validate=validate.Length(equal=15))
    contact_email = fields.Email(required=True)
    contact_phone = fields.String(required=False, validate=validate.Length(max=20))
    address = fields.String(required=False)
    category = fields.String(required=False, validate=validate.Length(max=100))

class VendorUpdateSchema(Schema):
    company_name = fields.String(required=False, validate=validate.Length(min=2, max=150))
    contact_email = fields.Email(required=False)
    contact_phone = fields.String(required=False, validate=validate.Length(max=20))
    address = fields.String(required=False)
    category = fields.String(required=False, validate=validate.Length(max=100))
    status = fields.String(required=False, validate=validate.OneOf(['PENDING', 'APPROVED', 'REJECTED', 'BLACKLISTED']))
    rating = fields.Float(required=False, validate=validate.Range(min=0.0, max=5.0))

class VendorResponseSchema(Schema):
    id = fields.Int()
    user_id = fields.Int(allow_none=True)
    company_name = fields.Str()
    gst_number = fields.Str()
    contact_email = fields.Email()
    contact_phone = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    category = fields.Str(allow_none=True)
    status = fields.Str()
    rating = fields.Float()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
