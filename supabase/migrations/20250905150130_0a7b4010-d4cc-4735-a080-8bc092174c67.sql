-- Recreate the trigger function to handle send_notification_email logic properly
-- Only skip email sending if send_notification_email is explicitly set to false
-- In all other cases (null or true), send the email
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only send notification if send_notification_email is NOT explicitly false
  -- This means: send when null, send when true, don't send only when false
  IF NEW.send_notification_email IS DISTINCT FROM FALSE THEN
    -- Send booking created notification
    PERFORM send_booking_notification(NEW.id, 'booking_created');
  END IF;
  RETURN NEW;
END;
$function$;