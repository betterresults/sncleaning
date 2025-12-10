-- Drop existing policies on quote_leads if they exist
DROP POLICY IF EXISTS "Allow anonymous insert to quote_leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Allow anonymous update to quote_leads" ON public.quote_leads;

-- Allow anonymous users to INSERT into quote_leads
CREATE POLICY "Allow anonymous insert to quote_leads"
ON public.quote_leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to UPDATE their own quote_leads (needed for upsert)
CREATE POLICY "Allow anonymous update to quote_leads"
ON public.quote_leads
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);