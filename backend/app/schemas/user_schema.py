from marshmallow import Schema, fields, validate

class UserRegisterSchema(Schema):
    email = fields.Email(required=True, validate=validate.Length(max=150))
    password = fields.String(required=True, validate=validate.Length(min=6, max=50))
    first_name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    role = fields.String(required=True, validate=validate.OneOf(['ADMIN', 'PROCUREMENT', 'MANAGER', 'VENDOR']))
    company_name = fields.String(required=False, validate=validate.Length(max=150)) # Only for Vendor register
    gst_number = fields.String(required=False, validate=validate.Length(equal=15)) # Only for Vendor register
    category = fields.String(required=False, validate=validate.Length(max=100)) # Only for Vendor register

class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)

class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)

class UserResponseSchema(Schema):
    id = fields.Int()
    email = fields.Email()
    first_name = fields.Str()
    last_name = fields.Str()
    role = fields.Str()
    is_active = fields.Bool()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
