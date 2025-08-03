-- Temporarily add a more permissive policy for debugging
CREATE POLICY "Allow authenticated users to view recurring services" 
ON public.recurring_services 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Also let's check what tables don't have RLS enabled (this might be blocking the query)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;