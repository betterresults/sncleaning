-- Improve the auto_create_customer_account function to prevent duplicates
CREATE OR REPLACE FUNCTION public.auto_create_customer_account()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    temp_password text;
    existing_customer_id bigint;
BEGIN
    -- Only create account if customer has email and doesn't already exist
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        
        -- Check if customer already exists by email
        SELECT id INTO existing_customer_id
        FROM public.customers
        WHERE email = NEW.email
        LIMIT 1;
        
        -- If customer doesn't exist, create it
        IF existing_customer_id IS NULL THEN
            -- Generate a temporary password
            temp_password := substr(md5(random()::text), 1, 12) || 'A1!';
            
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
    END IF;
    
    RETURN NEW;
END;
$function$