-- Add missing booking rescheduled notification trigger
INSERT INTO notification_triggers (
  name,
  trigger_event,
  template_id,
  is_enabled,
  timing_offset,
  timing_unit,
  recipient_types,
  conditions
) 
SELECT 
  'Booking Rescheduled Notification',
  'booking_rescheduled',
  template_id,
  true,
  0,
  'immediate',
  ARRAY['customer']::text[],
  '{}'::jsonb
FROM notification_triggers 
WHERE name = 'Booking Created Notification'
LIMIT 1;

-- Update the booking update trigger to also check for rescheduling
CREATE OR REPLACE FUNCTION notify_booking_update()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_action boolean;
  is_rescheduled boolean;
BEGIN
  -- Check if this is an admin action (bypass auto-notifications)
  is_admin_action := current_setting('app.current_user_role', true) = 'admin';
  
  -- Check if this is a reschedule (date or time changed)
  is_rescheduled := (OLD.service_date != NEW.service_date OR OLD.service_time != NEW.service_time);
  
  -- Skip notifications for admin actions
  IF is_admin_action THEN
    RETURN NEW;
  END IF;
  
  -- Handle rescheduling
  IF is_rescheduled THEN
    PERFORM send_booking_notification(NEW.id, 'booking_rescheduled');
  -- Handle status changes
  ELSIF OLD.status != NEW.status THEN
    CASE NEW.status
      WHEN 'completed' THEN
        PERFORM send_booking_notification(NEW.id, 'booking_completion');
      WHEN 'cancelled' THEN
        PERFORM send_booking_notification(NEW.id, 'booking_status_update');
      ELSE
        PERFORM send_booking_notification(NEW.id, 'booking_status_update');
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;