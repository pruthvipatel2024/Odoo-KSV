from marshmallow import Schema, fields

class ActivityLogSchema(Schema):
    id = fields.Int()
    user_id = fields.Int(allow_none=True)
    user_email = fields.Str()
    user_name = fields.Str()
    action = fields.Str()
    details = fields.Str(allow_none=True)
    created_at = fields.DateTime()

class ApprovalHistorySchema(Schema):
    id = fields.Int()
    entity_type = fields.Str()
    entity_id = fields.Int()
    status_from = fields.Str(allow_none=True)
    status_to = fields.Str()
    action_by = fields.Int(allow_none=True)
    actor_name = fields.Str()
    remarks = fields.Str(allow_none=True)
    created_at = fields.DateTime()
