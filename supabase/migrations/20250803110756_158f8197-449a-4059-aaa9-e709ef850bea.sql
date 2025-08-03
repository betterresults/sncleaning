-- Add a temporary UPDATE policy for authenticated users
CREATE POLICY "Allow authenticated users to update recurring services" 
ON public.recurring_services 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');