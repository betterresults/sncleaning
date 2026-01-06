-- Add carpet cleaning items columns to quote_leads table
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS carpet_items jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS upholstery_items jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mattress_items jsonb DEFAULT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN public.quote_leads.carpet_items IS 'JSON array of carpet cleaning items selected';
COMMENT ON COLUMN public.quote_leads.upholstery_items IS 'JSON array of upholstery items selected';
COMMENT ON COLUMN public.quote_leads.mattress_items IS 'JSON array of mattress items selected';