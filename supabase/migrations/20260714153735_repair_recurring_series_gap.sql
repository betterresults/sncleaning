-- Phase 4.1: Per-series recurring gap repair.
-- Extends generate_recurring_bookings with optional p_service_id and adds
-- repair_recurring_series_gap(p_service_id) for staff: reset cursor from last
-- real booking (or NULL) then fill that series only.

DROP FUNCTION IF EXISTS public.generate_recurring_bookings(text);
DROP FUNCTION IF EXISTS public.generate_recurring_bookings(text, bigint);

CREATE OR REPLACE FUNCTION public.generate_recurring_bookings(
  p_triggered_by text DEFAULT 'cron',
  p_service_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  days_until_target INTEGER;
  base_date DATE;
  freq_interval INTERVAL;
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

  -- Auto-resume postponed series when resume_date has arrived
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

        target_dow := CASE LOWER(TRIM(SPLIT_PART(rec.days_of_the_week, ',', 1)))
          WHEN 'sunday' THEN 0
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          ELSE NULL
        END;

        IF target_dow IS NULL THEN
          v_services_with_errors := v_services_with_errors + 1;
          v_errors := v_errors || jsonb_build_array(jsonb_build_object(
            'service_id', rec.id,
            'error', 'Invalid days_of_the_week'
          ));
          CONTINUE;
        END IF;

        IF rec.was_created_until IS NOT NULL THEN
          next_booking_date := rec.was_created_until + freq_interval;

          WHILE next_booking_date < CURRENT_DATE LOOP
            next_booking_date := next_booking_date + freq_interval;
          END LOOP;

          IF EXTRACT(DOW FROM next_booking_date)::INTEGER != target_dow THEN
            days_until_target := (target_dow - EXTRACT(DOW FROM next_booking_date)::INTEGER + 7) % 7;
            IF days_until_target = 0 THEN
              days_until_target := 7;
            END IF;
            next_booking_date := next_booking_date + days_until_target;
          END IF;
        ELSE
          base_date := GREATEST(rec.start_date::DATE, CURRENT_DATE);

          IF EXTRACT(DOW FROM base_date)::INTEGER = target_dow THEN
            next_booking_date := base_date;
          ELSE
            days_until_target := (target_dow - EXTRACT(DOW FROM base_date)::INTEGER + 7) % 7;
            IF days_until_target = 0 THEN
              days_until_target := 7;
            END IF;
            next_booking_date := base_date + days_until_target;
          END IF;
        END IF;

        service_hours := COALESCE(rec.hours::NUMERIC, 3);
        calculated_cleaner_pay := ROUND(service_hours * COALESCE(rec.cleaner_rate, 0), 2);

        SELECT a.address, a.postcode INTO address_text, address_postcode
        FROM addresses a WHERE a.id = rec.address::UUID;

        booking_time := rec.start_time::TIME;

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

          UPDATE recurring_services SET was_created_until = next_booking_date WHERE id = rec.id;
          next_booking_date := next_booking_date + freq_interval;
        END LOOP;
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

CREATE OR REPLACE FUNCTION public.repair_recurring_series_gap(p_service_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service public.recurring_services%ROWTYPE;
  v_anchor date;
  v_before date;
  v_after date;
  v_gen jsonb;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_agent'::app_role)
  ) THEN
    RAISE EXCEPTION 'Staff access required';
  END IF;

  IF p_service_id IS NULL THEN
    RAISE EXCEPTION 'service_id is required';
  END IF;

  SELECT * INTO v_service
  FROM public.recurring_services
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring series % not found', p_service_id;
  END IF;

  IF v_service.confirmed IS NOT TRUE THEN
    RAISE EXCEPTION 'Series % is not confirmed', p_service_id;
  END IF;

  IF v_service.postponed IS TRUE THEN
    RAISE EXCEPTION 'Series % is postponed — resume it before repairing', p_service_id;
  END IF;

  IF v_service.start_time IS NULL
     OR v_service.start_date IS NULL
     OR v_service.days_of_the_week IS NULL THEN
    RAISE EXCEPTION 'Series % is missing schedule fields — fix via Edit first', p_service_id;
  END IF;

  IF v_service.recurring_group_id IS NULL THEN
    RAISE EXCEPTION 'Series % is missing recurring_group_id — fix via Edit first', p_service_id;
  END IF;

  v_before := v_service.was_created_until;

  -- Last real non-cancelled booking for this group (past or future).
  SELECT max(b.date_only::date) INTO v_anchor
  FROM public.bookings b
  WHERE b.recurring_group_id = v_service.recurring_group_id
    AND lower(coalesce(b.booking_status, '')) <> 'cancelled';

  -- Reset cursor: if bookings exist, resume from the latest; else clear so
  -- generate seeds from GREATEST(start_date, today).
  UPDATE public.recurring_services
  SET was_created_until = v_anchor
  WHERE id = p_service_id
  RETURNING was_created_until INTO v_after;

  v_gen := public.generate_recurring_bookings('admin', p_service_id);

  RETURN jsonb_build_object(
    'service_id', p_service_id,
    'was_created_until_before', v_before,
    'was_created_until_anchor', v_anchor,
    'was_created_until_after_reset', v_after,
    'generation', v_gen
  );
END;
$$;

-- Keep no-arg / text-only call paths working for cron and admin "Run now".
CREATE OR REPLACE FUNCTION public.run_recurring_generation_now()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_agent'::app_role)
  ) THEN
    RAISE EXCEPTION 'Staff access required';
  END IF;

  RETURN public.generate_recurring_bookings('admin', NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_recurring_bookings(text, bigint) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.repair_recurring_series_gap(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_recurring_generation_now() TO authenticated;
