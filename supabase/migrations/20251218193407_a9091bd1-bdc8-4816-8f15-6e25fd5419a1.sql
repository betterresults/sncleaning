-- Allow anyone to SELECT quote_leads by short_code (for short link resolution)
CREATE POLICY "Allow public read by short_code" 
ON public.quote_leads 
FOR SELECT 
USING (short_code IS NOT NULL);