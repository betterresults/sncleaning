-- Revert unnecessary RLS policy changes since customer components already don't fetch admin_cost
-- The useCustomerLinenOrders hook and LinenOrdersView component already exclude admin_cost from queries and display

-- Customers already can only see: id, order_date, delivery_date, pickup_date, status, payment_status, payment_method, total_cost, notes
-- admin_cost is not fetched or displayed to customers, so no additional security needed

-- This migration reverts the previous changes and keeps existing working policies
DROP POLICY IF EXISTS "Customers can view their own linen orders" ON linen_orders;

-- Restore original policy that was working fine
CREATE POLICY "Customers can view their own linen orders"
ON linen_orders
FOR SELECT
USING (customer_id IN (
  SELECT profiles.customer_id
  FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
));