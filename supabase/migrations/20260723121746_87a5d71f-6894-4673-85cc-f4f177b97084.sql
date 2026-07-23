DROP TRIGGER IF EXISTS trigger_booking_confirmation_email ON public.bookings;
DROP FUNCTION IF EXISTS public.send_booking_confirmation_email();