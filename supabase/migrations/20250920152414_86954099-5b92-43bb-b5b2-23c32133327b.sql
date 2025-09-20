-- Restore the automatic payment triggers with improved double-payment protection
CREATE TRIGGER trg_capture_on_past_booking_insert
    AFTER INSERT ON public.past_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.capture_payment_on_past_booking();

CREATE TRIGGER trg_capture_on_past_booking_update  
    AFTER UPDATE OF payment_status ON public.past_bookings
    FOR EACH ROW
    WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
    EXECUTE FUNCTION public.capture_payment_on_past_booking();