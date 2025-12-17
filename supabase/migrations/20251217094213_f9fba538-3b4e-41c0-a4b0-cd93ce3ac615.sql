-- Allow sales agents to view customer payment methods
CREATE POLICY "Sales agents can view payment methods"
ON public.customer_payment_methods
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));