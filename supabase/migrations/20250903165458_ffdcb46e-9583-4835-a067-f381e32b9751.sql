-- Update the booking_created notification trigger to also send to admin
UPDATE notification_triggers 
SET recipient_types = ARRAY['customer', 'admin']::text[]
WHERE trigger_event = 'booking_created';

-- Also insert the admin email address if it doesn't exist
INSERT INTO admin_email_recipients (email, name, is_active)
VALUES ('sales@sncleaningservices.co.uk', 'Sales Team', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;