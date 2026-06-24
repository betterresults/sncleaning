
-- 1. Add tracking columns to quote_leads
ALTER TABLE public.quote_leads
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS abandoned_sms_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_quote_leads_abandoned_followup
  ON public.quote_leads (last_activity_at)
  WHERE abandoned_sms_sent_at IS NULL;

-- 2. automation_settings table
CREATE TABLE IF NOT EXISTS public.automation_settings (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_settings TO authenticated;
GRANT ALL ON public.automation_settings TO service_role;

ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read automation settings"
  ON public.automation_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can upsert automation settings"
  ON public.automation_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER automation_settings_updated_at
  BEFORE UPDATE ON public.automation_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Seed the abandoned-lead follow-up settings row
INSERT INTO public.automation_settings (key, enabled, config) VALUES (
  'abandoned_lead_followup',
  false,
  jsonb_build_object(
    'delay_minutes', 15,
    'max_age_minutes', 180,
    'admin_phone', '+447960612595',
    'message_template',
    E'Abandoned lead: {first_name} ({phone}).\nTap to WhatsApp them:\n{wa_link}',
    'whatsapp_template',
    'Hi {first_name}, I just noticed you were looking at a cleaning quote on our website earlier today. I wasn''t sure whether you found the information you were looking for, so I thought I''d quickly check in and see if there''s anything I can help with. Silvia, S&N Cleaning Services.'
  )
)
ON CONFLICT (key) DO NOTHING;
