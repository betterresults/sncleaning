-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE public.sub_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for sub_bookings
CREATE POLICY "Admins can manage all sub bookings" ON public.sub_bookings
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::app_role
  )
);

-- Add basic RLS policies for role_permissions (read-only for authenticated users)
CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
FOR SELECT TO authenticated
USING (true);

-- Add RLS policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::app_role
  )
);