-- Allow customers to view their own pricing overrides
CREATE POLICY "Customers can view their own pricing overrides"
ON public.customer_pricing_overrides
FOR SELECT
USING (
  customer_id IN (
    SELECT customer_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND customer_id IS NOT NULL
  )
);