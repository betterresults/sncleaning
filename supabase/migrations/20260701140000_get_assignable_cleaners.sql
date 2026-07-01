-- Customers hitting the booking forms (e.g. /customer-add-booking) call the same
-- useLinkedCleaners() hook as admin/sales-agent flows to render the cleaner picker.
-- That hook previously queried `profiles`, `cleaners`, `cleaner_service_types`,
-- `cleaner_coverage_areas`, and `cleaner_working_hours` directly — all of which only
-- grant SELECT to admins, sales agents, or a cleaner viewing their own row. For a
-- customer, every one of those selects silently returns zero rows under RLS, so the
-- picker rendered "No cleaners found" instead of the full list (each disabled with a
-- reason) that CleanerSelector already supports.
--
-- This SECURITY DEFINER function exposes only what the picker needs — never the
-- cleaner's pay rates unless the caller is an admin or sales agent — to any
-- authenticated user, so the "show every cleaner, disable + explain the ones that
-- don't fit" UX works for customers too.
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
  working_hours JSONB
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
    COALESCE(wh.working_hours, '[]'::JSONB) AS working_hours
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
  ORDER BY c.first_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_assignable_cleaners() TO authenticated;
