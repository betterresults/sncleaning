-- Honour one-off cancels, keep monthly jobs on the chosen weekday, and
-- resume empty biweekly/monthly series from start_date cadence.
-- Weekly series with upcoming rows keep last+interval behaviour.

CREATE OR REPLACE FUNCTION public.recurring_step_to_dow(
  p_date date,
  p_interval interval,
  p_dow integer
)
RETURNS date
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path TO 'public'
AS $$
  SELECT public.recurring_align_date_to_dow((p_date + p_interval)::date, p_dow);
$$;

CREATE OR REPLACE FUNCTION public.recurring_occurrence_is_cancelled(
  p_customer bigint,
  p_date date
)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.past_bookings pb
    WHERE pb.customer = p_customer
      AND pb.date_only = p_date
      AND lower(coalesce(pb.booking_status, '')) LIKE '%cancel%'
  );
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
  v_customer bigint;
BEGIN
  IF p_days_of_the_week IS NULL
     OR p_recurring_group_id IS NULL
     OR p_start_date IS NULL THEN
    RETURN false;
  END IF;

  SELECT rs.customer
  INTO v_customer
  FROM public.recurring_services rs
  WHERE rs.recurring_group_id = p_recurring_group_id
  LIMIT 1;

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
      next_booking_date := public.recurring_step_to_dow(last_for_dow, freq_interval, target_dow);
      WHILE next_booking_date < CURRENT_DATE LOOP
        next_booking_date := public.recurring_step_to_dow(next_booking_date, freq_interval, target_dow);
      END LOOP;
    ELSE
      next_booking_date := public.recurring_align_date_to_dow(p_start_date, target_dow);
      WHILE next_booking_date < CURRENT_DATE LOOP
        next_booking_date := public.recurring_step_to_dow(next_booking_date, freq_interval, target_dow);
      END LOOP;
    END IF;

    WHILE next_booking_date <= CURRENT_DATE + INTERVAL '30 days' LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.recurring_group_id = p_recurring_group_id
          AND b.date_only = next_booking_date
          AND lower(coalesce(b.booking_status, '')) <> 'cancelled'
      ) AND NOT public.recurring_occurrence_is_cancelled(v_customer, next_booking_date) THEN
        RETURN true;
      END IF;
      next_booking_date := public.recurring_step_to_dow(next_booking_date, freq_interval, target_dow);
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

REVOKE ALL ON FUNCTION public.recurring_step_to_dow(date, interval, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recurring_occurrence_is_cancelled(bigint, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recurring_has_missing_weekday(text, text, date, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.recurring_step_to_dow(date, interval, integer) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.recurring_occurrence_is_cancelled(bigint, date) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.recurring_has_missing_weekday(text, text, date, uuid) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.generate_recurring_bookings(text, bigint) TO postgres, service_role;
