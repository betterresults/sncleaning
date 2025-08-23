-- Create a function to manually test webhook sync for debugging
CREATE OR REPLACE FUNCTION test_stripe_webhook_sync(p_customer_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Call the sync-payment-methods function 
    SELECT net.http_post(
        url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/sync-payment-methods',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
        body := json_build_object('customerEmail', p_customer_email)::jsonb
    ) INTO result;
    
    RETURN result;
END;
$$;