-- Add short_code column for short URL system
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;

-- Add agent_user_id to track which agent sent the quote
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS agent_user_id UUID;

-- Create index for fast lookups by short_code
CREATE INDEX IF NOT EXISTS idx_quote_leads_short_code ON public.quote_leads(short_code) WHERE short_code IS NOT NULL;