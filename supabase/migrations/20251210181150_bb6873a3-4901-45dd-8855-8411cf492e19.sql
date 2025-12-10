-- Add more detailed pricing fields to quote_leads for accurate tracking
ALTER TABLE public.quote_leads ADD COLUMN IF NOT EXISTS weekly_cost numeric;
ALTER TABLE public.quote_leads ADD COLUMN IF NOT EXISTS discount_amount numeric;
ALTER TABLE public.quote_leads ADD COLUMN IF NOT EXISTS short_notice_charge numeric;
ALTER TABLE public.quote_leads ADD COLUMN IF NOT EXISTS is_first_time_customer boolean;