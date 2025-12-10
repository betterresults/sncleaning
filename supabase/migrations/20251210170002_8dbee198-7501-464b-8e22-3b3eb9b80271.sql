-- First, let's completely disable and re-enable RLS to reset policies for funnel_events
ALTER TABLE public.funnel_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on funnel_events
DROP POLICY IF EXISTS "funnel_events_anon_insert" ON public.funnel_events;
DROP POLICY IF EXISTS "funnel_events_auth_insert" ON public.funnel_events;
DROP POLICY IF EXISTS "funnel_events_admin_select" ON public.funnel_events;
DROP POLICY IF EXISTS "allow_anon_insert_funnel_events" ON public.funnel_events;
DROP POLICY IF EXISTS "allow_auth_insert_funnel_events" ON public.funnel_events;
DROP POLICY IF EXISTS "allow_admin_select_funnel_events" ON public.funnel_events;
DROP POLICY IF EXISTS "Anyone can insert funnel events" ON public.funnel_events;
DROP POLICY IF EXISTS "Admins can view funnel events" ON public.funnel_events;

-- Create simple INSERT policy for everyone (anon and authenticated)
CREATE POLICY "Anyone can insert funnel events"
ON public.funnel_events
FOR INSERT
WITH CHECK (true);

-- Create SELECT policy for admins
CREATE POLICY "Admins can view funnel events"
ON public.funnel_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Now do the same for quote_leads
ALTER TABLE public.quote_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_leads ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on quote_leads
DROP POLICY IF EXISTS "Anyone can insert quote leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Admins can view quote leads" ON public.quote_leads;
DROP POLICY IF EXISTS "Admins can update quote leads" ON public.quote_leads;
DROP POLICY IF EXISTS "allow_anon_insert_quote_leads" ON public.quote_leads;
DROP POLICY IF EXISTS "allow_auth_insert_quote_leads" ON public.quote_leads;
DROP POLICY IF EXISTS "allow_admin_select_quote_leads" ON public.quote_leads;

-- Create simple INSERT policy for everyone
CREATE POLICY "Anyone can insert quote leads"
ON public.quote_leads
FOR INSERT
WITH CHECK (true);

-- Create simple UPDATE policy for everyone (needed for upsert)
CREATE POLICY "Anyone can update quote leads"
ON public.quote_leads
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create SELECT policy for admins
CREATE POLICY "Admins can view quote leads"
ON public.quote_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);