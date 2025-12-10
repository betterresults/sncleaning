-- Completely remove ALL policies from quote_leads
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'quote_leads' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.quote_leads', pol.policyname);
    END LOOP;
END $$;

-- Completely remove ALL policies from funnel_events
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'funnel_events' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.funnel_events', pol.policyname);
    END LOOP;
END $$;

-- Create clean policies for quote_leads
CREATE POLICY "allow_anon_insert_quote_leads" 
ON public.quote_leads 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "allow_auth_insert_quote_leads" 
ON public.quote_leads 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_anon_update_quote_leads" 
ON public.quote_leads 
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_auth_update_quote_leads" 
ON public.quote_leads 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_admin_select_quote_leads" 
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

-- Create clean policies for funnel_events
CREATE POLICY "allow_anon_insert_funnel_events" 
ON public.funnel_events 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "allow_auth_insert_funnel_events" 
ON public.funnel_events 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_admin_select_funnel_events" 
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