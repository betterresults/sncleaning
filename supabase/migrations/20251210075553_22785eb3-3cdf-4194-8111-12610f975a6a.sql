-- Enable RLS on funnel_events (it was created but RLS might not be enabled)
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any and recreate them properly
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON public.funnel_events;
DROP POLICY IF EXISTS "Admins can view funnel events" ON public.funnel_events;

-- Allow anonymous inserts for tracking
CREATE POLICY "Anyone can insert funnel events" 
ON public.funnel_events 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to view events
CREATE POLICY "Admins can view funnel events" 
ON public.funnel_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Fix quote_leads table - allow anonymous inserts for lead tracking
DROP POLICY IF EXISTS "Anyone can insert quote leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Admins can view quote leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Anyone can update quote leads" ON public.quote_leads;

-- Enable RLS if not already enabled
ALTER TABLE public.quote_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
CREATE POLICY "Anyone can insert quote leads" 
ON public.quote_leads 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous updates (for upsert to work with session_id)
CREATE POLICY "Anyone can update quote leads" 
ON public.quote_leads 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow admins to view
CREATE POLICY "Admins can view quote leads" 
ON public.quote_leads 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);