-- Add RLS policies for sales agents to manage their own profile
CREATE POLICY "Sales agents can view their own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'sales_agent'::app_role
  )
);

CREATE POLICY "Sales agents can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'sales_agent'::app_role
  )
);