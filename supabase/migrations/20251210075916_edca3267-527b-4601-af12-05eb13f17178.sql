-- Drop all existing policies on quote_leads
DROP POLICY IF EXISTS "Anyone can insert quote leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Anyone can update quote leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Admins can view quote leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Anyone can insert quote_leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Admins can view all quote_leads" ON public.quote_leads;

-- Recreate with PERMISSIVE policies (default is RESTRICTIVE which blocks)
CREATE POLICY "Public insert quote leads" 
ON public.quote_leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public update quote leads" 
ON public.quote_leads 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin select quote leads" 
ON public.quote_leads 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Also fix funnel_events
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON public.funnel_events;
DROP POLICY IF EXISTS "Admins can view funnel events" ON public.funnel_events;
DROP POLICY IF EXISTS "Admins can view all funnel events" ON public.funnel_events;

CREATE POLICY "Public insert funnel events" 
ON public.funnel_events 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admin select funnel events" 
ON public.funnel_events 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);