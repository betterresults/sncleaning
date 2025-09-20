-- Create function to automatically process payments when bookings are added to past_bookings with authorized status
CREATE OR REPLACE FUNCTION public.capture_payment_on_past_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only process if payment_status is 'authorized'
    IF NEW.payment_status = 'authorized' THEN
        -- Call the stripe-process-payments edge function
        PERFORM net.http_post(
            url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/stripe-process-payments',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
            body := '{}'::jsonb
        );
        
        RAISE NOTICE 'Triggered automatic payment processing for past booking ID: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_capture_on_past_booking_insert ON public.past_bookings;
DROP TRIGGER IF EXISTS trg_capture_on_past_booking_update ON public.past_bookings;

-- Create trigger for INSERT (when booking moves to past_bookings)
CREATE TRIGGER trg_capture_on_past_booking_insert
    AFTER INSERT ON public.past_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.capture_payment_on_past_booking();

-- Create trigger for UPDATE (when payment_status changes to authorized)
CREATE TRIGGER trg_capture_on_past_booking_update  
    AFTER UPDATE OF payment_status ON public.past_bookings
    FOR EACH ROW
    WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
    EXECUTE FUNCTION public.capture_payment_on_past_booking();