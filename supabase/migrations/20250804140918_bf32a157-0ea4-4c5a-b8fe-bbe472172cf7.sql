-- Function to automatically create account when customer is created
CREATE OR REPLACE FUNCTION auto_create_customer_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    temp_password text;
BEGIN
    -- Generate a temporary password
    temp_password := substr(md5(random()::text), 1, 12) || 'A1!';
    
    -- Only create account if customer has email
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        -- Call the edge function to create account
        PERFORM net.http_post(
            url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/create-customer-account',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
            body := json_build_object(
                'customer_id', NEW.id,
                'send_email', true
            )::jsonb
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-create accounts for new customers
CREATE TRIGGER trigger_auto_create_customer_account
    AFTER INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer_account();