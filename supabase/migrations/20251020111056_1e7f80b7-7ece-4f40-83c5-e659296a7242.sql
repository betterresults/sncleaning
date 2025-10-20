-- Add trigger for automatic Invoiless invoice creation on past_bookings
CREATE OR REPLACE FUNCTION trigger_invoiless_auto_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if payment_method is 'Invoiless' and no invoice exists yet
  IF NEW.payment_method = 'Invoiless' AND NEW.invoice_id IS NULL THEN
    -- Call edge function to create and send invoice
    PERFORM net.http_post(
      url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/invoiless-create-send',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
      body := json_build_object(
        'bookingId', NEW.id,
        'bookingType', 'past'
      )::jsonb
    );
    
    RAISE NOTICE 'Triggered automatic Invoiless invoice creation for past booking ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on past_bookings table
DROP TRIGGER IF EXISTS auto_create_invoiless_invoice ON past_bookings;
CREATE TRIGGER auto_create_invoiless_invoice
  AFTER INSERT ON past_bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_invoiless_auto_create();

-- Set up pg_cron job for daily invoice sync at 8:00 AM
SELECT cron.schedule(
  'invoiless-daily-sync',
  '0 8 * * *', -- 8:00 AM every day
  $$
  SELECT net.http_post(
    url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/invoiless-sync-status',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
