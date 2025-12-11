-- Add last_heartbeat column to track if browser is still open
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_quote_leads_status_heartbeat 
ON public.quote_leads(status, last_heartbeat);

-- Comment for documentation
COMMENT ON COLUMN public.quote_leads.last_heartbeat IS 'Last time the browser sent a heartbeat - used to detect idle vs left sessions';