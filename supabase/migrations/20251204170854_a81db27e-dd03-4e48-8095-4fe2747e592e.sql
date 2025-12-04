-- Add SMS template support to notification_triggers
ALTER TABLE notification_triggers
ADD COLUMN IF NOT EXISTS sms_template_id uuid REFERENCES sms_templates(id),
ADD COLUMN IF NOT EXISTS notification_channel text DEFAULT 'email' CHECK (notification_channel IN ('email', 'sms', 'both'));

-- Add comment for clarity
COMMENT ON COLUMN notification_triggers.notification_channel IS 'Channel for notification: email, sms, or both';
COMMENT ON COLUMN notification_triggers.sms_template_id IS 'Reference to SMS template for SMS notifications';