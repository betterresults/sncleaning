-- Fix the RLS policy to remove insecure user_metadata reference
DROP POLICY "Admins can manage all recurring services" ON public.recurring_services;

-- Create a secure policy using only the user_roles table
CREATE POLICY "Admins can manage all recurring services" 
ON public.recurring_services 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);