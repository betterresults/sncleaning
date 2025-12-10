-- Add user_id column to funnel_events for persistent user tracking
ALTER TABLE public.funnel_events ADD COLUMN IF NOT EXISTS user_id text;

-- Add user_id column to quote_leads for persistent user tracking
ALTER TABLE public.quote_leads ADD COLUMN IF NOT EXISTS user_id text;

-- Create indexes for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_funnel_events_user_id ON public.funnel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_leads_user_id ON public.quote_leads(user_id);