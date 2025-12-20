-- Disable the problematic duplicate trigger that has NULL template_id
UPDATE notification_triggers 
SET is_enabled = false 
WHERE id = '8123075f-56f9-412f-af3e-139166a4f52d';

-- Also drop the old INTEGER version of the function to avoid confusion
DROP FUNCTION IF EXISTS send_booking_notification(integer, text);