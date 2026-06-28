-- Add tracking column for last CRM Lead status sent to Meta (dedupe).
ALTER TABLE public.quote_leads
  ADD COLUMN IF NOT EXISTS crm_lead_status_sent text,
  ADD COLUMN IF NOT EXISTS crm_lead_status_sent_at timestamptz;

-- Trigger function: when status changes (or row inserted), call the
-- meta-capi-crm-lead edge function via pg_net so Meta receives a
-- Conversions API "Lead" event tied to the lead's new CRM stage.
CREATE OR REPLACE FUNCTION public.notify_meta_crm_lead_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/meta-capi-crm-lead';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4';
BEGIN
  -- Only fire when status actually changes (or on insert)
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'lead_id', NEW.id,
      'status', NEW.status,
      'previous_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quote_leads_meta_crm_lead_trg ON public.quote_leads;
CREATE TRIGGER quote_leads_meta_crm_lead_trg
AFTER INSERT OR UPDATE OF status ON public.quote_leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_meta_crm_lead_status();