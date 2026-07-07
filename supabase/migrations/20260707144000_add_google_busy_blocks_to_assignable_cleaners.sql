-- Include Google Calendar busy windows in the assignable-cleaners RPC so assignment
-- UIs can block cleaners who are busy for a specific booking date/time.

DROP FUNCTION IF EXISTS public.get_assignable_cleaners();

CREATE OR REPLACE FUNCTION public.get_assignable_cleaners()
RETURNS TABLE (
  id BIGINT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  hourly_rate NUMERIC,
  presentage_rate NUMERIC,
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
