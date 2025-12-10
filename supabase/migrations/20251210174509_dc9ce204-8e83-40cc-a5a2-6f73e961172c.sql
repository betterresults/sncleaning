-- Allow admins to delete quote_leads for testing/cleanup
CREATE POLICY "Admins can delete quote_leads"
ON public.quote_leads
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));