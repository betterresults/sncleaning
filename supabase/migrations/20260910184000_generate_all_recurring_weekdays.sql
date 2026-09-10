-- Recurring series can store multiple weekdays ("thursday, monday"),
-- but generate_recurring_bookings only used SPLIT_PART(..., 1).
-- Walk every trimmed day, starting from that day's last booking
-- (or today) so a Thursday cursor cannot hide missing Mondays.

CREATE OR REPLACE FUNCTION public.recurring_day_name_to_dow(p_day text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path TO 'public'
AS $$
  SELECT CASE LOWER(TRIM(p_day))
    WHEN 'sunday' THEN 0
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.recurring_align_date_to_dow(p_date date, p_dow integer)
RETURNS date
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_date IS NULL OR p_dow IS NULL THEN NULL
    WHEN EXTRACT(DOW FROM p_date)::integer = p_dow THEN p_date
    ELSE p_date + ((p_dow - EXTRACT(DOW FROM p_date)::integer + 7) % 7)
  END;
$$;

CREATE OR REPLACE FUNCTION public.recurring_has_missing_weekday(
  p_days_of_the_week text,
  p_frequently text,
  p_start_date date,
  p_recurring_group_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  target_dow integer;
  freq_interval interval;
  next_booking_date date;
  last_for_dow date;
  base_date date;
BEGIN
  IF p_days_of_the_week IS NULL
     OR p_recurring_group_id IS NULL
     OR p_start_date IS NULL THEN
    RETURN false;
  END IF;

  CASE LOWER(REPLACE(COALESCE(p_frequently, ''), '-', ''))
    WHEN 'weekly' THEN freq_interval := INTERVAL '7 days';
    WHEN 'biweekly' THEN freq_interval := INTERVAL '14 days';
    WHEN 'monthly' THEN freq_interval := INTERVAL '30 days';
    ELSE freq_interval := INTERVAL '7 days';
  END CASE;

  FOR target_dow IN
    SELECT DISTINCT public.recurring_day_name_to_dow(TRIM(BOTH FROM token))
    FROM unnest(string_to_array(p_days_of_the_week, ',')) AS token
    WHERE public.recurring_day_name_to_dow(TRIM(BOTH FROM token)) IS NOT NULL
  LOOP
    SELECT max(b.date_only::date)
    INTO last_for_dow
    FROM public.bookings b
    WHERE b.recurring_group_id = p_recurring_group_id
      AND EXTRACT(DOW FROM b.date_only)::integer = target_dow
      AND lower(coalesce(b.booking_status, '')) <> 'cancelled';

    IF last_for_dow IS NOT NULL THEN
      next_booking_date := last_for_dow + freq_interval;
      WHILE next_booking_date < CURRENT_DATE LOOP
        next_booking_date := next_booking_date + freq_interval;
      END LOOP;
      next_booking_date := public.recurring_align_date_to_dow(next_booking_date, target_dow);
    ELSE
      base_date := GREATEST(p_start_date, CURRENT_DATE);
      next_booking_date := public.recurring_align_date_to_dow(base_date, target_dow);
    END IF;

    WHILE next_booking_date <= CURRENT_DATE + INTERVAL '30 days' LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.recurring_group_id = p_recurring_group_id
          AND b.date_only = next_booking_date
          AND lower(coalesce(b.booking_status, '')) <> 'cancelled'
      ) THEN
        RETURN true;
      END IF;
      next_booking_date := next_booking_date + freq_interval;
    END LOOP;
  END LOOP;

  RETURN false;
END;
$$;

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
  base_date DATE;
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
        calculated_cleaner_pay := ROUND(service_hours * COALESCE(rec.cleaner_rate, 0), 2);

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
            next_booking_date := last_for_dow + freq_interval;
            WHILE next_booking_date < CURRENT_DATE LOOP
              next_booking_date := next_booking_date + freq_interval;
            END LOOP;
            next_booking_date := public.recurring_align_date_to_dow(next_booking_date, target_dow);
          ELSE
            base_date := GREATEST(rec.start_date::DATE, CURRENT_DATE);
            next_booking_date := public.recurring_align_date_to_dow(base_date, target_dow);
          END IF;

          WHILE next_booking_date <= CURRENT_DATE + INTERVAL '30 days' LOOP
            booking_datetime := (next_booking_date || ' ' || booking_time)::TIMESTAMP WITH TIME ZONE;

            IF NOT EXISTS (
              SELECT 1 FROM bookings
              WHERE recurring_group_id = rec.recurring_group_id
                AND date_only = next_booking_date
            ) THEN
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

            next_booking_date := next_booking_date + freq_interval;
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

CREATE OR REPLACE FUNCTION public.get_recurring_generation_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_run public.recurring_generation_runs%ROWTYPE;
  v_active integer;
  v_gaps jsonb;
  v_gap_count integer;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_agent'::app_role)
  ) THEN
    RAISE EXCEPTION 'Staff access required';
  END IF;

  SELECT * INTO v_last_run
  FROM public.recurring_generation_runs
  ORDER BY started_at DESC
  LIMIT 1;

  SELECT count(*)::integer INTO v_active
  FROM public.recurring_services rs
  WHERE rs.confirmed = true
    AND rs.postponed IS NOT TRUE;

  SELECT coalesce(jsonb_agg(row_to_json(g)::jsonb ORDER BY g.service_id), '[]'::jsonb),
         count(*)::integer
  INTO v_gaps, v_gap_count
  FROM (
    SELECT
      rs.id AS service_id,
      trim(concat_ws(' ', c.first_name, c.last_name)) AS customer_name,
      rs.frequently,
      rs.days_of_the_week,
      rs.was_created_until,
      rs.start_time,
      CASE
        WHEN rs.start_time IS NULL OR rs.start_date IS NULL OR rs.days_of_the_week IS NULL
          THEN 'missing_schedule_fields'
        WHEN rs.recurring_group_id IS NULL
          THEN 'missing_group_id'
        WHEN NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.recurring_group_id = rs.recurring_group_id
            AND b.date_only >= CURRENT_DATE
            AND lower(coalesce(b.booking_status, '')) <> 'cancelled'
        ) THEN 'no_upcoming_booking'
        WHEN public.recurring_has_missing_weekday(
          rs.days_of_the_week,
          rs.frequently,
          rs.start_date::date,
          rs.recurring_group_id
        ) THEN 'missing_weekday'
        WHEN rs.was_created_until IS NULL
          OR rs.was_created_until < (
            CURRENT_DATE + (
              CASE lower(replace(coalesce(rs.frequently, ''), '-', ''))
                WHEN 'monthly' THEN 0
                WHEN 'biweekly' THEN 7
                ELSE 14
              END
            )
          )
          THEN 'horizon_lag'
        ELSE NULL
      END AS reason
    FROM public.recurring_services rs
    LEFT JOIN public.customers c ON c.id = rs.customer
    WHERE rs.confirmed = true
      AND rs.postponed IS NOT TRUE
  ) g
  WHERE g.reason IS NOT NULL;

  RETURN jsonb_build_object(
    'active_series', v_active,
    'gap_count', coalesce(v_gap_count, 0),
    'gaps', coalesce(v_gaps, '[]'::jsonb),
    'last_run', CASE
      WHEN v_last_run.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', v_last_run.id,
        'started_at', v_last_run.started_at,
        'finished_at', v_last_run.finished_at,
        'status', v_last_run.status,
        'triggered_by', v_last_run.triggered_by,
        'services_processed', v_last_run.services_processed,
        'bookings_created', v_last_run.bookings_created,
        'bookings_skipped', v_last_run.bookings_skipped,
        'services_with_errors', v_last_run.services_with_errors,
        'error_message', v_last_run.error_message
      )
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.recurring_day_name_to_dow(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recurring_align_date_to_dow(date, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recurring_has_missing_weekday(text, text, date, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.recurring_day_name_to_dow(text) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.recurring_align_date_to_dow(date, integer) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.recurring_has_missing_weekday(text, text, date, uuid) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.generate_recurring_bookings(text, bigint) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.get_recurring_generation_health() TO authenticated;
