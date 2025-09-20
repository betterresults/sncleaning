-- Disable automatic payment triggers immediately
DROP TRIGGER IF EXISTS trg_capture_on_past_booking_insert ON public.past_bookings;
DROP TRIGGER IF EXISTS trg_capture_on_past_booking_update ON public.past_bookings;