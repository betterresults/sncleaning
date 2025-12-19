-- Allow admins to view all user roles (needed to see sales agents list)
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = auth.uid()
  AND ur.role = 'admin'::app_role
));