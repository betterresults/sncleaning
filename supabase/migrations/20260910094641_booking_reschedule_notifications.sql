-- When a booking date/time is edited, date_only/time_only stayed on the original
-- values, reminder rows kept the original scheduled_for, and the admin "send email"
-- prompt requested a booking_status_update template that does not exist. Clients
-- kept the original confirmation and later reminders for the old slot.
--
-- Reuse the existing pipeline: sync wall-clock columns from date_time, cancel and
-- recreate reminder schedules (same as create), and send via send_booking_notification
-- using the already-enabled booking_rescheduled trigger.

CREATE OR REPLACE FUNCTION public.update_date_and_time_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.date_time IS NOT NULL THEN
    NEW.date_only := (NEW.date_time AT TIME ZONE 'UTC')::date;
    NEW.time_only := (NEW.date_time AT TIME ZONE 'UTC')::time;
  ELSIF NEW.date_only IS NOT NULL AND NEW.time_only IS NOT NULL THEN
    NEW.date_time := (NEW.date_only + NEW.time_only)::timestamp with time zone;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_update_date_time ON public.bookings;
CREATE TRIGGER trg_update_date_time
BEFORE INSERT OR UPDATE OF date_time ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_date_and_time_columns();

CREATE OR REPLACE FUNCTION public.schedule_booking_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trigger_rec RECORD;
  customer_email TEXT;
  cleaner_email TEXT;
  admin_email TEXT := 'sales@sncleaningservices.co.uk';
  booking_naive TIMESTAMP;
  booking_datetime TIMESTAMPTZ;
  scheduled_time TIMESTAMPTZ;
  recipient_type TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.date_time IS NOT DISTINCT FROM NEW.date_time THEN
      RETURN NEW;
    END IF;

    UPDATE notification_schedules
    SET status = 'cancelled', updated_at = NOW()
    WHERE entity_type = 'booking'
      AND entity_id = NEW.id::text
      AND status = 'scheduled'
      AND trigger_id IN (
        SELECT id FROM notification_triggers
        WHERE trigger_event IN ('booking_reminder', 'payment_reminder', 'payment_collection')
      );
  END IF;

  SELECT email INTO customer_email
  FROM customers WHERE id = NEW.customer;

  IF NEW.cleaner IS NOT NULL THEN
    SELECT email INTO cleaner_email
    FROM cleaners WHERE id = NEW.cleaner;
  END IF;

  booking_naive := COALESCE(
    (NEW.date_time AT TIME ZONE 'UTC'),
    (NEW.date_only::date + COALESCE(NEW.time_only, '09:00:00'::time))
  );
  booking_datetime := booking_naive AT TIME ZONE 'Europe/London';

  FOR trigger_rec IN
    SELECT * FROM notification_triggers
    WHERE is_enabled = true
      AND timing_offset IS NOT NULL
      AND timing_offset != 0
      AND trigger_event IN (
        'booking_created',
        'booking_reminder',
        'payment_reminder',
        'payment_collection'
      )
      AND (
        TG_OP = 'INSERT'
        OR trigger_event IN ('booking_reminder', 'payment_reminder', 'payment_collection')
      )
  LOOP
    IF trigger_rec.trigger_event = 'booking_created' THEN
      CASE trigger_rec.timing_unit
        WHEN 'minutes' THEN
          scheduled_time := NOW() + (trigger_rec.timing_offset || ' minutes')::interval;
        WHEN 'hours' THEN
          scheduled_time := NOW() + (trigger_rec.timing_offset || ' hours')::interval;
        WHEN 'days' THEN
          scheduled_time := NOW() + (trigger_rec.timing_offset || ' days')::interval;
        ELSE
          scheduled_time := NOW() + (trigger_rec.timing_offset || ' hours')::interval;
      END CASE;
    ELSE
      CASE trigger_rec.timing_unit
        WHEN 'minutes' THEN
          scheduled_time := booking_datetime + (trigger_rec.timing_offset || ' minutes')::interval;
        WHEN 'hours' THEN
          scheduled_time := booking_datetime + (trigger_rec.timing_offset || ' hours')::interval;
        WHEN 'days' THEN
          scheduled_time := booking_datetime + (trigger_rec.timing_offset || ' days')::interval;
        ELSE
          scheduled_time := booking_datetime + (trigger_rec.timing_offset || ' hours')::interval;
      END CASE;
    END IF;

    IF scheduled_time > NOW() THEN
      FOREACH recipient_type IN ARRAY trigger_rec.recipient_types
      LOOP
        IF recipient_type = 'customer' AND customer_email IS NOT NULL THEN
          INSERT INTO notification_schedules (
            trigger_id, entity_type, entity_id, recipient_email, recipient_type, scheduled_for, status
          ) VALUES (
            trigger_rec.id, 'booking', NEW.id::text, customer_email, 'customer', scheduled_time, 'scheduled'
          );
        ELSIF recipient_type = 'cleaner' AND cleaner_email IS NOT NULL THEN
          INSERT INTO notification_schedules (
            trigger_id, entity_type, entity_id, recipient_email, recipient_type, scheduled_for, status
          ) VALUES (
            trigger_rec.id, 'booking', NEW.id::text, cleaner_email, 'cleaner', scheduled_time, 'scheduled'
          );
        ELSIF recipient_type = 'admin' THEN
          INSERT INTO notification_schedules (
            trigger_id, entity_type, entity_id, recipient_email, recipient_type, scheduled_for, status
          ) VALUES (
            trigger_rec.id, 'booking', NEW.id::text, admin_email, 'admin', scheduled_time, 'scheduled'
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS schedule_notifications_on_booking_reschedule ON public.bookings;
CREATE TRIGGER schedule_notifications_on_booking_reschedule
AFTER UPDATE OF date_time ON public.bookings
FOR EACH ROW
WHEN (OLD.date_time IS DISTINCT FROM NEW.date_time)
EXECUTE FUNCTION schedule_booking_notifications();

CREATE OR REPLACE FUNCTION public.send_booking_notification(booking_id bigint, event_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
  customer_record RECORD;
  trigger_record RECORD;
  template_record email_notification_templates%ROWTYPE;
  sms_template_record sms_templates%ROWTYPE;
  notification_variables JSONB;
  recipient_email TEXT;
  recipient_type TEXT;
  recipient_phone TEXT;
  auth_header TEXT;
  sms_content TEXT;
  formatted_date TEXT;
  formatted_time TEXT;
BEGIN
  SELECT
    b.id,
    b.date_time,
    b.address,
    b.postcode,
    b.total_cost,
    b.service_type,
    b.customer,
    b.phone_number,
    COALESCE(c.first_name || ' ' || c.last_name, c.first_name, 'Not assigned') as cleaner_name
  FROM bookings b
  LEFT JOIN cleaners c ON b.cleaner = c.id
  WHERE b.id = send_booking_notification.booking_id
  INTO booking_record;

  IF NOT FOUND THEN
    RAISE WARNING 'Booking not found: %', booking_id;
    RETURN;
  END IF;

  SELECT
    email,
    phone,
    COALESCE(first_name || ' ' || last_name, first_name, email) as full_name
  FROM customers
  WHERE id = booking_record.customer
  INTO customer_record;

  SELECT * FROM notification_triggers
  WHERE trigger_event = event_type AND is_enabled = true
  INTO trigger_record;

  IF NOT FOUND THEN
    RAISE WARNING 'No enabled trigger found for event: %', event_type;
    RETURN;
  END IF;

  SELECT * FROM email_notification_templates
  WHERE id = trigger_record.template_id AND is_active = true
  INTO template_record;

  IF trigger_record.sms_template_id IS NOT NULL THEN
    SELECT * FROM sms_templates
    WHERE id = trigger_record.sms_template_id AND is_active = true
    INTO sms_template_record;
  END IF;

  formatted_date := COALESCE(
    TO_CHAR(booking_record.date_time AT TIME ZONE 'UTC', 'FMDay, DD FMMonth YYYY'),
    'TBC'
  );
  formatted_time := COALESCE(
    TO_CHAR(booking_record.date_time AT TIME ZONE 'UTC', 'HH24:MI'),
    'TBC'
  );

  notification_variables := jsonb_build_object(
    'booking_id', booking_id::TEXT,
    'customer_name', COALESCE(customer_record.full_name, 'Valued Customer'),
    'booking_date', formatted_date,
    'booking_time', formatted_time,
    'service_type', CASE
      WHEN booking_record.service_type = 'Domestic' THEN 'Domestic Cleaning'
      WHEN booking_record.service_type = 'Air BnB' THEN 'Airbnb Cleaning'
      WHEN booking_record.service_type = 'Standard Cleaning' THEN 'Standard Cleaning'
      ELSE COALESCE(booking_record.service_type, 'Cleaning Service')
    END,
    'address', COALESCE(booking_record.address, 'Address not specified'),
    'booking_address', COALESCE(booking_record.address, 'Address not specified'),
    'postcode', COALESCE(booking_record.postcode, ''),
    'cleaner_name', COALESCE(booking_record.cleaner_name, 'To be assigned'),
    'total_cost', COALESCE(booking_record.total_cost::TEXT, '0')
  );

  auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4';

  FOREACH recipient_type IN ARRAY trigger_record.recipient_types
  LOOP
    IF recipient_type = 'customer' AND customer_record.email IS NOT NULL THEN
      recipient_email := customer_record.email;
      recipient_phone := COALESCE(customer_record.phone, booking_record.phone_number);
    ELSIF recipient_type = 'admin' THEN
      recipient_email := 'sales@sncleaningservices.co.uk';
      recipient_phone := NULL;
    ELSE
      CONTINUE;
    END IF;

    IF (trigger_record.notification_channel IS NULL OR trigger_record.notification_channel = 'email' OR trigger_record.notification_channel = 'both')
       AND template_record.id IS NOT NULL THEN
      PERFORM net.http_post(
        url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-notification-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', auth_header
        ),
        body := jsonb_build_object(
          'template_id', template_record.id,
          'recipient_email', recipient_email,
          'recipient_type', recipient_type,
          'variables', notification_variables,
          'trigger_id', trigger_record.id,
          'entity_type', 'booking',
          'entity_id', booking_id::TEXT
        )
      );
    END IF;

    IF trigger_record.sms_template_id IS NOT NULL
       AND (trigger_record.notification_channel = 'sms' OR trigger_record.notification_channel = 'both')
       AND sms_template_record.id IS NOT NULL
       AND recipient_phone IS NOT NULL THEN

      sms_content := sms_template_record.content;
      sms_content := REPLACE(sms_content, '{{booking_id}}', booking_id::TEXT);
      sms_content := REPLACE(sms_content, '{{customer_name}}', COALESCE(customer_record.full_name, 'Valued Customer'));
      sms_content := REPLACE(sms_content, '{{booking_date}}', formatted_date);
      sms_content := REPLACE(sms_content, '{{booking_time}}', formatted_time);
      sms_content := REPLACE(sms_content, '{{address}}', COALESCE(booking_record.address, 'Address not specified'));
      sms_content := REPLACE(sms_content, '{{postcode}}', COALESCE(booking_record.postcode, ''));
      sms_content := REPLACE(sms_content, '{{total_cost}}', COALESCE(booking_record.total_cost::TEXT, '0'));
      sms_content := REPLACE(sms_content, '{{cleaner_name}}', COALESCE(booking_record.cleaner_name, 'To be assigned'));

      PERFORM net.http_post(
        url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-sms-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', auth_header
        ),
        body := jsonb_build_object(
          'to', recipient_phone,
          'message', sms_content
        )
      );

      INSERT INTO notification_logs (
        trigger_id, template_id, recipient_email, recipient_type, subject, content,
        entity_type, entity_id, status, sent_at, notification_type
      ) VALUES (
        trigger_record.id, NULL, recipient_phone, recipient_type, 'SMS notification sent', sms_content,
        'booking', booking_id, 'sent', NOW(), 'sms'
      );
    END IF;
  END LOOP;
END;
$function$;

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

-- Skip row triggers so this backfill does not write activity logs or
-- re-run payment sync for every historically drifted booking.
SET session_replication_role = replica;
UPDATE bookings
SET date_only = (date_time AT TIME ZONE 'UTC')::date,
    time_only = (date_time AT TIME ZONE 'UTC')::time
WHERE date_time IS NOT NULL
  AND (
    date_only IS DISTINCT FROM (date_time AT TIME ZONE 'UTC')::date
    OR time_only IS DISTINCT FROM (date_time AT TIME ZONE 'UTC')::time
  );
SET session_replication_role = DEFAULT;
