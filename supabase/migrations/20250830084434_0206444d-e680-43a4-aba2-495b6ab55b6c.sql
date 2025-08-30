-- Create trigger to automatically move cancelled bookings to past_bookings
CREATE OR REPLACE TRIGGER move_cancelled_bookings_trigger
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    WHEN (NEW.booking_status = 'cancelled' AND OLD.booking_status IS DISTINCT FROM 'cancelled')
    EXECUTE FUNCTION public.move_cancelled_bookings_to_past();