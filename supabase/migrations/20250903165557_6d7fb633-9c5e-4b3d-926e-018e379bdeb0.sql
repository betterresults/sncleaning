-- Just update the booking_created notification trigger to also send to admin
UPDATE notification_triggers 
SET recipient_types = ARRAY['customer', 'admin']::text[]
WHERE trigger_event = 'booking_created';