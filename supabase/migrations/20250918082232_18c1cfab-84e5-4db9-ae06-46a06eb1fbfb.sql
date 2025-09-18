-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to run stripe-process-payments every 5 minutes
SELECT cron.schedule(
  'stripe-process-payments-every-5-minutes',
  '*/5 * * * *',
  $$
  SELECT pg_net.http_post(
    url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/stripe-process-payments',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDUwMTA1MywiZXhwIjoyMDQ2MDc3MDUzfQ.XKv-2rrMWbL3Q5NbywdAnq_-LJNnaBpNWUwZUb5dGDg", "Content-Type": "application/json"}',
    body := '{}'
  ) AS result;
  $$
);