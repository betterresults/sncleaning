-- Update RLS policy for customer_payment_methods to allow admins to view all payment methods
DROP POLICY IF EXISTS "Customers can view their own payment methods" ON customer_payment_methods;

CREATE POLICY "Customers can view their own payment methods OR admins can view all" 
ON customer_payment_methods 
FOR SELECT 
USING (
  customer_id IN ( 
    SELECT profiles.customer_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  ) 
  OR 
  EXISTS ( 
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  )
);