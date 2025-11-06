-- Drop the existing trigger
DROP TRIGGER IF EXISTS trg_move_completed_bookings ON public.bookings;

-- Recreate the trigger with case-insensitive condition
CREATE TRIGGER trg_move_completed_bookings
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    WHEN (LOWER(NEW.booking_status) = 'completed' AND LOWER(OLD.booking_status) IS DISTINCT FROM 'completed')
    EXECUTE FUNCTION public.move_complated_bookings_to_past();