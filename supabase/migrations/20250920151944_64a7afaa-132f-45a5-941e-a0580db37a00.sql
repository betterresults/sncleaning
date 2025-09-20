-- Immediately disable the automatic payment triggers to prevent further double charges
DROP TRIGGER IF EXISTS trg_capture_on_past_booking_insert ON public.past_bookings;
DROP TRIGGER IF EXISTS trg_capture_on_past_booking_update ON public.past_bookings;