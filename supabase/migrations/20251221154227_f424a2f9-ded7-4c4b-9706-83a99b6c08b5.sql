-- Add missing fields to quote_leads for complete tracking
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS cleaning_products text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS equipment_arrangement text DEFAULT NULL;