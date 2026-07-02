-- Adds a simple boolean "equipment capability" toggle to cleaners: whether they
-- bring their own cleaning equipment (vacuum, mop, supplies, etc.). This is a
-- placeholder for a fuller equipment-type system later — for now it's a single
-- yes/no flag, mirroring the soft-match pattern used for service types/areas,
-- so the shareable scheduling page can eventually filter on it too.
--
-- Defaults to TRUE so existing cleaners aren't retroactively flagged as missing
-- equipment until an admin explicitly toggles it off.
ALTER TABLE public.cleaners
  ADD COLUMN IF NOT EXISTS has_equipment BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.cleaners.has_equipment IS
  'Whether this cleaner brings their own cleaning equipment (vacuum, mop, supplies). Used to match against bookings that require equipment.';

-- Expose has_equipment through the existing SECURITY DEFINER picker RPC so it's
-- visible to every caller (admins, sales agents, customers booking their own job)
-- the same way service_type_keys/coverage_area_ids/working_hours already are.
-- The return type is changing (new column), so the old signature must be dropped first.
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
  ORDER BY c.first_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_assignable_cleaners() TO authenticated;
