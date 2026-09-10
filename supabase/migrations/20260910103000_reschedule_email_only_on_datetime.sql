-- Address-only edits were treated as reschedules and sent
-- "Your booking date has been changed". Status-update manual
-- sends were mapped onto that same template. UI stores Cancelled
-- (capital C) so pending reminders were never cancelled.

CREATE OR REPLACE FUNCTION public.notify_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role text;
BEGIN
  IF NEW.booking_status ILIKE '%cancel%' OR lower(COALESCE(NEW.booking_status, '')) = 'completed' THEN
    RETURN NEW;
  END IF;

  IF OLD.date_time IS NOT DISTINCT FROM NEW.date_time THEN
    RETURN NEW;
  END IF;

  SELECT role INTO current_user_role
  FROM user_roles
  WHERE user_id = auth.uid();

  IF current_user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  PERFORM send_booking_notification(NEW.id, 'booking_rescheduled');
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_notify_booking_update ON public.bookings;
CREATE TRIGGER trigger_notify_booking_update
AFTER UPDATE ON public.bookings
FOR EACH ROW
WHEN (
  OLD.date_time IS DISTINCT FROM NEW.date_time
  AND COALESCE(NEW.booking_status, '') NOT ILIKE '%cancel%'
  AND lower(COALESCE(NEW.booking_status, '')) IS DISTINCT FROM 'completed'
)
EXECUTE FUNCTION notify_booking_update();

CREATE OR REPLACE FUNCTION public.send_manual_booking_email(
  p_booking_id bigint,
  p_email_type text,
  p_additional_variables jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
  customer_record RECORD;
  template_record RECORD;
  variables jsonb;
  event_type text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  event_type := CASE p_email_type
    WHEN 'booking_confirmation' THEN 'booking_created'
    WHEN 'booking_completion' THEN 'booking_completed'
    WHEN 'payment_reminder' THEN 'booking_reminder'
    ELSE p_email_type
  END;

  IF EXISTS (
    SELECT 1 FROM notification_triggers
    WHERE trigger_event = event_type AND is_enabled = true
  ) THEN
    PERFORM send_booking_notification(p_booking_id, event_type);
    RETURN json_build_object('success', true, 'message', 'Email sent successfully');
  END IF;

  SELECT * INTO booking_record
  FROM bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  SELECT first_name, last_name, email
  INTO customer_record
  FROM customers
  WHERE id = booking_record.customer;

  IF customer_record.email IS NULL OR customer_record.email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Customer has no email address');
  END IF;

  SELECT id INTO template_record
  FROM email_notification_templates
  WHERE name = p_email_type AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Email template not found');
  END IF;

  variables := jsonb_build_object(
    'customer_name', COALESCE(customer_record.first_name || ' ' || customer_record.last_name, customer_record.first_name, 'Customer'),
    'booking_date', COALESCE(TO_CHAR(booking_record.date_time AT TIME ZONE 'UTC', 'FMDay, DD FMMonth YYYY'), 'TBC'),
    'booking_time', COALESCE(TO_CHAR(booking_record.date_time AT TIME ZONE 'UTC', 'HH24:MI'), 'TBC'),
    'booking_address', booking_record.address,
    'address', booking_record.address,
    'total_cost', booking_record.total_cost::text,
    'booking_id', booking_record.id::text,
    'booking_status', booking_record.booking_status,
    'payment_status', booking_record.payment_status
  );

  variables := variables || p_additional_variables;

  PERFORM send_email_notification(template_record.id, customer_record.email, variables);

  RETURN json_build_object('success', true, 'message', 'Email sent successfully');
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_scheduled_notifications_on_booking_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.booking_status ILIKE '%cancel%'
     AND COALESCE(OLD.booking_status, '') NOT ILIKE '%cancel%' THEN
    UPDATE notification_schedules
    SET status = 'cancelled', updated_at = NOW()
    WHERE entity_type = 'booking'
      AND entity_id = NEW.id::text
      AND status = 'scheduled';
  END IF;

  RETURN NEW;
END;
$function$;
