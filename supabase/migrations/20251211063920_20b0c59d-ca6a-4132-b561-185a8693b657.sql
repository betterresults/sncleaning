-- Add column to track if quote email was sent
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS quote_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quote_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Comment for documentation
COMMENT ON COLUMN public.quote_leads.quote_email_sent IS 'Whether a quote email was sent to this lead';
COMMENT ON COLUMN public.quote_leads.quote_email_sent_at IS 'When the quote email was sent';