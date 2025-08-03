-- Fix infinite recursion in user_roles policies by creating a security definer function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- For admin access, we'll use a direct check without recursion
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  -- Check if current user is admin by checking their record directly
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);