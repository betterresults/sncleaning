-- Public booking forms (create-public-booking, multi-step quote flows) run on the anon
-- key. get_assignable_cleaners is SECURITY DEFINER and already omits pay rates for
-- non-admin callers, so granting anon lets ScheduleStep filter time slots against
-- real cleaner availability without exposing sensitive data.

GRANT EXECUTE ON FUNCTION public.get_assignable_cleaners() TO anon;
