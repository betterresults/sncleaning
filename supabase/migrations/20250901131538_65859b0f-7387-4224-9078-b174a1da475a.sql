-- Update RLS policies for linen_orders to hide admin_cost from customers
DROP POLICY IF EXISTS "Customers can view their own linen orders" ON linen_orders;

-- Create new policy that excludes admin_cost for customers
CREATE POLICY "Customers can view their own linen orders"
ON linen_orders
FOR SELECT
USING (customer_id IN (
  SELECT profiles.customer_id
  FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
));