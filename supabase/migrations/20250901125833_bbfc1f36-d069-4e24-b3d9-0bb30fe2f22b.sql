-- Drop the existing trigger
DROP TRIGGER IF EXISTS calculate_cleaner_pay_trigger ON public.bookings;

-- Create a new version of the calculate_cleaner_pay function that respects completed bookings
CREATE OR REPLACE FUNCTION public.calculate_cleaner_pay()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Don't recalculate cleaner pay if:
    -- 1. The booking is being marked as completed/cancelled (pay should be final)
    -- 2. The cleaner pay was already set and we're just updating status
    IF (NEW.booking_status IN ('Completed', 'completed', 'Cancelled', 'cancelled') AND 
        OLD.booking_status IS NOT NULL AND 
        OLD.booking_status NOT IN ('Completed', 'completed', 'Cancelled', 'cancelled') AND
        OLD.cleaner_pay IS NOT NULL AND 
        OLD.cleaner_pay > 0) THEN
        -- Keep the existing cleaner pay when marking as completed/cancelled
        NEW.cleaner_pay := OLD.cleaner_pay;
        RETURN NEW;
    END IF;

    -- Original calculation logic for other cases
    IF (
        TG_OP = 'INSERT' OR
        NEW.total_hours IS DISTINCT FROM OLD.total_hours OR
        NEW.total_cost IS DISTINCT FROM OLD.total_cost OR
        NEW.cleaner_rate IS DISTINCT FROM OLD.cleaner_rate OR
        NEW.cleaner_percentage IS DISTINCT FROM OLD.cleaner_percentage
    ) THEN
        IF NEW.total_hours IS NULL OR NEW.total_hours = 0 THEN
            NEW.cleaner_pay := ROUND(NEW.total_cost * NEW.cleaner_percentage / 100);
        ELSE
            NEW.cleaner_pay := (NEW.total_hours * NEW.cleaner_rate);
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER calculate_cleaner_pay_trigger 
    BEFORE INSERT OR UPDATE ON public.bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_cleaner_pay();