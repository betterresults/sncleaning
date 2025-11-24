-- Create trigger function to cancel Stripe authorization when booking is cancelled
CREATE OR REPLACE FUNCTION public.cancel_stripe_authorization_on_booking_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only process if booking is being cancelled and has authorized payment
    IF NEW.booking_status = 'cancelled' AND 
       (OLD.booking_status IS NULL OR OLD.booking_status != 'cancelled') AND
       NEW.payment_status = 'authorized' AND
       NEW.invoice_id IS NOT NULL THEN
        
        -- Call the stripe-cancel-authorization edge function
        PERFORM net.http_post(
            url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/stripe-cancel-authorization',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
            body := json_build_object(
                'bookingId', NEW.id,
                'paymentIntentId', NEW.invoice_id
            )::jsonb
        );
        
        RAISE NOTICE 'Triggered automatic Stripe authorization cancellation for booking ID: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_cancel_stripe_authorization ON public.bookings;
CREATE TRIGGER trigger_cancel_stripe_authorization
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.cancel_stripe_authorization_on_booking_cancel();