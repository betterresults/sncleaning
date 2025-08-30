-- Add explicit DELETE policy for admins on linen_orders
DROP POLICY IF EXISTS "Admins can delete linen orders" ON public.linen_orders;
CREATE POLICY "Admins can delete linen orders"
ON public.linen_orders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::app_role
  )
);

-- Also ensure admins can delete linen order items when deleting an order
DROP POLICY IF EXISTS "Admins can delete linen order items" ON public.linen_order_items;
CREATE POLICY "Admins can delete linen order items" 
ON public.linen_order_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'::app_role
  )
);