-- Cleaner default pay type, 1-hour arrival windows in emails,
-- and recurring pay type so generated jobs match the series.

ALTER TABLE public.cleaners
  ADD COLUMN IF NOT EXISTS default_payment_type text NOT NULL DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS fixed_amount numeric;

ALTER TABLE public.cleaners
  DROP CONSTRAINT IF EXISTS cleaners_default_payment_type_check;

ALTER TABLE public.cleaners
  ADD CONSTRAINT cleaners_default_payment_type_check
  CHECK (default_payment_type IN ('hourly', 'percentage', 'fixed'));

ALTER TABLE public.recurring_services
  ADD COLUMN IF NOT EXISTS cleaner_pay_type text NOT NULL DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS cleaner_percentage numeric,
  ADD COLUMN IF NOT EXISTS cleaner_fixed_amount numeric;

ALTER TABLE public.recurring_services
  DROP CONSTRAINT IF EXISTS recurring_services_cleaner_pay_type_check;

ALTER TABLE public.recurring_services
  ADD CONSTRAINT recurring_services_cleaner_pay_type_check
  CHECK (cleaner_pay_type IN ('hourly', 'percentage', 'fixed'));

CREATE OR REPLACE FUNCTION public.format_booking_arrival_slot(p_time time)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_time IS NULL THEN 'Flexible'
    ELSE trim(to_char(p_time, 'FMHH12:MI AM'))
      || ' – '
      || trim(to_char(p_time + interval '1 hour', 'FMHH12:MI AM'))
  END;
$$;

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
    b.time_only,
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
  formatted_time := CASE
    WHEN booking_record.time_only IS NULL THEN 'Flexible'
    ELSE public.format_booking_arrival_slot(booking_record.time_only)
  END;

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
    'booking_time', CASE
      WHEN booking_record.time_only IS NULL THEN 'Flexible'
      ELSE public.format_booking_arrival_slot(booking_record.time_only)
    END,
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

DROP FUNCTION IF EXISTS public.get_assignable_cleaners();

CREATE OR REPLACE FUNCTION public.get_assignable_cleaners()
RETURNS TABLE (
  id BIGINT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  hourly_rate NUMERIC,
  presentage_rate NUMERIC,
  default_payment_type TEXT,
  fixed_amount NUMERIC,
  service_type_keys TEXT[],
  coverage_area_ids TEXT[],
  working_hours JSONB,
  calendar_busy_blocks JSONB,
  has_equipment BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.full_name,
    CASE
      WHEN public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales_agent')
      THEN c.hourly_rate
      ELSE NULL
    END AS hourly_rate,
    CASE
      WHEN public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales_agent')
      THEN c.presentage_rate
      ELSE NULL
    END AS presentage_rate,
    CASE
      WHEN public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales_agent')
      THEN c.default_payment_type
      ELSE NULL
    END AS default_payment_type,
    CASE
      WHEN public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales_agent')
      THEN c.fixed_amount
      ELSE NULL
    END AS fixed_amount,
    COALESCE(st.service_type_keys, ARRAY[]::TEXT[]) AS service_type_keys,
    COALESCE(ca.coverage_area_ids, ARRAY[]::TEXT[]) AS coverage_area_ids,
    COALESCE(wh.working_hours, '[]'::JSONB) AS working_hours,
    COALESCE(gb.calendar_busy_blocks, '[]'::JSONB) AS calendar_busy_blocks,
    c.has_equipment
  FROM public.cleaners c
  INNER JOIN public.profiles p ON p.cleaner_id = c.id
  LEFT JOIN (
    SELECT cleaner_id, array_agg(service_type_key) AS service_type_keys
    FROM public.cleaner_service_types
    GROUP BY cleaner_id
  ) st ON st.cleaner_id = c.id
  LEFT JOIN (
    SELECT cleaner_id, array_agg(borough_id::TEXT) AS coverage_area_ids
    FROM public.cleaner_coverage_areas
    GROUP BY cleaner_id
  ) ca ON ca.cleaner_id = c.id
  LEFT JOIN (
    SELECT cleaner_id, jsonb_agg(jsonb_build_object(
      'day_of_week', day_of_week,
      'start_time', start_time,
      'end_time', end_time
    )) AS working_hours
    FROM public.cleaner_working_hours
    GROUP BY cleaner_id
  ) wh ON wh.cleaner_id = c.id
  LEFT JOIN (
    SELECT cleaner_id, jsonb_agg(jsonb_build_object(
      'starts_at', starts_at,
      'ends_at', ends_at,
      'is_all_day', is_all_day
    )) AS calendar_busy_blocks
    FROM public.cleaner_calendar_busy_blocks
    WHERE ends_at >= now() - INTERVAL '1 day'
      AND starts_at <= now() + INTERVAL '90 days'
      AND status <> 'cancelled'
    GROUP BY cleaner_id
  ) gb ON gb.cleaner_id = c.id
  ORDER BY c.first_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_assignable_cleaners() TO authenticated;
GRANT EXECUTE ON FUNCTION public.format_booking_arrival_slot(time) TO postgres, service_role, authenticated;

CREATE OR REPLACE FUNCTION public.generate_recurring_bookings(
  p_triggered_by text DEFAULT 'cron'::text,
  p_service_id bigint DEFAULT NULL::bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  next_booking_date DATE;
  booking_datetime TIMESTAMP WITH TIME ZONE;
  booking_time TIME;
  address_text TEXT;
  address_postcode TEXT;
  service_hours NUMERIC;
  calculated_cleaner_pay NUMERIC;
  target_dow INTEGER;
  last_for_dow DATE;
  freq_interval INTERVAL;
  v_valid_days integer;
  v_run_id bigint;
  v_services_processed integer := 0;
  v_bookings_created integer := 0;
  v_bookings_skipped integer := 0;
  v_services_with_errors integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_triggered_by text := COALESCE(NULLIF(trim(p_triggered_by), ''), 'cron');
  v_result jsonb;
BEGIN
  IF v_triggered_by NOT IN ('cron', 'admin') THEN
    v_triggered_by := 'cron';
  END IF;

  INSERT INTO public.recurring_generation_runs (triggered_by, status)
  VALUES (v_triggered_by, 'running')
  RETURNING id INTO v_run_id;

  UPDATE public.recurring_services
  SET postponed = false,
      resume_date = NULL
  WHERE postponed IS TRUE
    AND resume_date IS NOT NULL
    AND resume_date::date <= CURRENT_DATE;

  BEGIN
    FOR rec IN
      SELECT
        rs.id,
        rs.customer,
        rs.cleaner,
        rs.address,
        rs.start_date,
        rs.start_time,
        rs.hours,
        rs.total_cost,
        rs.cost_per_hour,
        rs.cleaner_rate,
        rs.cleaner_pay_type,
        rs.cleaner_percentage,
        rs.cleaner_fixed_amount,
        rs.cleaning_type,
        rs.frequently,
        rs.days_of_the_week,
        rs.was_created_until,
        rs.recurring_group_id,
        rs.payment_method,
        c.first_name,
        c.last_name,
        c.email,
        c.phone
      FROM recurring_services rs
      LEFT JOIN customers c ON rs.customer = c.id
      WHERE rs.confirmed = true
        AND rs.postponed IS NOT TRUE
        AND rs.start_time IS NOT NULL
        AND rs.start_date IS NOT NULL
        AND rs.days_of_the_week IS NOT NULL
        AND rs.recurring_group_id IS NOT NULL
        AND (p_service_id IS NULL OR rs.id = p_service_id)
    LOOP
      BEGIN
        v_services_processed := v_services_processed + 1;

        CASE LOWER(REPLACE(rec.frequently, '-', ''))
          WHEN 'weekly' THEN freq_interval := INTERVAL '7 days';
          WHEN 'biweekly' THEN freq_interval := INTERVAL '14 days';
          WHEN 'monthly' THEN freq_interval := INTERVAL '30 days';
          ELSE freq_interval := INTERVAL '7 days';
        END CASE;

        v_valid_days := 0;
        service_hours := COALESCE(rec.hours::NUMERIC, 3);
        calculated_cleaner_pay := CASE COALESCE(rec.cleaner_pay_type, 'hourly')
          WHEN 'percentage' THEN ROUND(COALESCE(rec.total_cost, 0) * COALESCE(rec.cleaner_percentage, 0) / 100, 2)
          WHEN 'fixed' THEN ROUND(COALESCE(rec.cleaner_fixed_amount, 0), 2)
          ELSE ROUND(service_hours * COALESCE(rec.cleaner_rate, 0), 2)
        END;

        SELECT a.address, a.postcode INTO address_text, address_postcode
        FROM addresses a WHERE a.id = rec.address::UUID;

        booking_time := rec.start_time::TIME;

        FOR target_dow IN
          SELECT DISTINCT public.recurring_day_name_to_dow(TRIM(BOTH FROM token))
          FROM unnest(string_to_array(rec.days_of_the_week, ',')) AS token
          WHERE public.recurring_day_name_to_dow(TRIM(BOTH FROM token)) IS NOT NULL
        LOOP
          v_valid_days := v_valid_days + 1;

          SELECT max(b.date_only::date)
          INTO last_for_dow
          FROM public.bookings b
          WHERE b.recurring_group_id = rec.recurring_group_id
            AND EXTRACT(DOW FROM b.date_only)::integer = target_dow
            AND lower(coalesce(b.booking_status, '')) <> 'cancelled';

          IF last_for_dow IS NOT NULL THEN
            next_booking_date := public.recurring_step_to_dow(last_for_dow, freq_interval, target_dow);
            WHILE next_booking_date < CURRENT_DATE LOOP
              next_booking_date := public.recurring_step_to_dow(next_booking_date, freq_interval, target_dow);
            END LOOP;
          ELSE
            next_booking_date := public.recurring_align_date_to_dow(rec.start_date::DATE, target_dow);
            WHILE next_booking_date < CURRENT_DATE LOOP
              next_booking_date := public.recurring_step_to_dow(next_booking_date, freq_interval, target_dow);
            END LOOP;
          END IF;

          WHILE next_booking_date <= CURRENT_DATE + INTERVAL '30 days' LOOP
            booking_datetime := (next_booking_date || ' ' || booking_time)::TIMESTAMP WITH TIME ZONE;

            IF NOT EXISTS (
              SELECT 1 FROM bookings
              WHERE recurring_group_id = rec.recurring_group_id
                AND date_only = next_booking_date
            ) AND NOT public.recurring_occurrence_is_cancelled(rec.customer, next_booking_date) THEN
              INSERT INTO bookings (
                customer, cleaner, address, postcode, date_time, date_only, time_only,
                total_hours, total_cost, cleaning_type, frequently, booking_status,
                first_name, last_name, email, phone_number, recurring_group_id,
                cleaner_pay, cleaner_rate, payment_method, created_by_source
              ) VALUES (
                rec.customer, rec.cleaner, address_text, address_postcode, booking_datetime,
                next_booking_date, booking_time,
                service_hours, rec.total_cost, rec.cleaning_type, rec.frequently, 'upcoming',
                rec.first_name, rec.last_name, rec.email, rec.phone, rec.recurring_group_id,
                calculated_cleaner_pay, rec.cleaner_rate, rec.payment_method, 'recurring_auto'
              );
              v_bookings_created := v_bookings_created + 1;
            ELSE
              v_bookings_skipped := v_bookings_skipped + 1;
            END IF;

            UPDATE recurring_services
            SET was_created_until = GREATEST(
              COALESCE(was_created_until, next_booking_date),
              next_booking_date
            )
            WHERE id = rec.id;

            next_booking_date := public.recurring_step_to_dow(next_booking_date, freq_interval, target_dow);
          END LOOP;
        END LOOP;

        IF v_valid_days = 0 THEN
          v_services_with_errors := v_services_with_errors + 1;
          v_errors := v_errors || jsonb_build_array(jsonb_build_object(
            'service_id', rec.id,
            'error', 'Invalid days_of_the_week'
          ));
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_services_with_errors := v_services_with_errors + 1;
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'service_id', rec.id,
          'error', SQLERRM
        ));
      END;
    END LOOP;

    UPDATE public.recurring_generation_runs
    SET finished_at = now(),
        status = 'success',
        services_processed = v_services_processed,
        bookings_created = v_bookings_created,
        bookings_skipped = v_bookings_skipped,
        services_with_errors = v_services_with_errors,
        details = jsonb_build_object(
          'errors', v_errors,
          'service_id_filter', p_service_id
        )
    WHERE id = v_run_id;

  EXCEPTION WHEN OTHERS THEN
    UPDATE public.recurring_generation_runs
    SET finished_at = now(),
        status = 'error',
        services_processed = v_services_processed,
        bookings_created = v_bookings_created,
        bookings_skipped = v_bookings_skipped,
        services_with_errors = v_services_with_errors,
        error_message = SQLERRM,
        details = jsonb_build_object(
          'errors', v_errors,
          'service_id_filter', p_service_id
        )
    WHERE id = v_run_id;
    RAISE;
  END;

  DELETE FROM public.recurring_generation_runs
  WHERE started_at < now() - INTERVAL '7 days';

  v_result := jsonb_build_object(
    'run_id', v_run_id,
    'triggered_by', v_triggered_by,
    'services_processed', v_services_processed,
    'bookings_created', v_bookings_created,
    'bookings_skipped', v_bookings_skipped,
    'services_with_errors', v_services_with_errors,
    'errors', v_errors,
    'service_id_filter', p_service_id
  );
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_recurring_bookings(text, bigint) TO postgres, service_role;
