-- Align gap "horizon_lag" with cadence so monthly series with a valid upcoming
-- booking are not false-flagged by the weekly-oriented +14 day rule.

CREATE OR REPLACE FUNCTION public.get_recurring_generation_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.get_recurring_generation_health() TO authenticated;
