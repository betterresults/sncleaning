-- Fix the search_path security issue for the new function
CREATE OR REPLACE FUNCTION public.capture_payment_on_past_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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