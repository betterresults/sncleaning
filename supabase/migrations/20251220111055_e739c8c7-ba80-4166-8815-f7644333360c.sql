-- Add weekly_hours column to store the regular weekly hours separately from first clean hours
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS weekly_hours numeric DEFAULT NULL;

-- Add first_deep_clean flag to store if first deep clean was selected
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS first_deep_clean boolean DEFAULT FALSE;

COMMENT ON COLUMN public.quote_leads.weekly_hours IS 'Regular weekly cleaning hours (separate from first clean hours when first deep clean is selected)';
COMMENT ON COLUMN public.quote_leads.first_deep_clean IS 'Whether first deep clean option was selected for recurring bookings';