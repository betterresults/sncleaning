-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "allow_anon_insert_funnel_events" ON public.funnel_events;
DROP POLICY IF EXISTS "allow_auth_insert_funnel_events" ON public.funnel_events;
DROP POLICY IF EXISTS "allow_admin_select_funnel_events" ON public.funnel_events;

-- Create policies that explicitly allow inserts for anonymous users
CREATE POLICY "funnel_events_anon_insert"
ON public.funnel_events
FOR INSERT
TO anon
WITH CHECK (true);

-- Create policies that allow inserts for authenticated users
CREATE POLICY "funnel_events_auth_insert"
ON public.funnel_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policies that allow admins to read all events
CREATE POLICY "funnel_events_admin_select"
ON public.funnel_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);