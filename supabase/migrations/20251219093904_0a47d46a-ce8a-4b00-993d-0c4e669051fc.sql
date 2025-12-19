-- Allow sales agents to insert their own profile
CREATE POLICY "Sales agents can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'sales_agent'
  )
);

-- Also allow regular users to insert their own profile (for new signups)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);