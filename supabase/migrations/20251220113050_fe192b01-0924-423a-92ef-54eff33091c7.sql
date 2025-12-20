-- Add property_access and access_notes columns to quote_leads
ALTER TABLE public.quote_leads 
ADD COLUMN IF NOT EXISTS property_access text,
ADD COLUMN IF NOT EXISTS access_notes text;