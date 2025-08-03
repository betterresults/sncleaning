-- Drop the existing policy
DROP POLICY "Admins can manage all recurring services" ON public.recurring_services;

-- Create a more permissive policy for admins that handles authentication edge cases
CREATE POLICY "Admins can manage all recurring services" 
ON public.recurring_services 
FOR ALL 
USING (
  -- Allow if user has admin role
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
  OR
  -- Allow if user has admin metadata (backup check)
  (auth.jwt() ->> 'user_role') = 'admin'
  OR
  -- Allow if user metadata contains admin role (another backup)
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);