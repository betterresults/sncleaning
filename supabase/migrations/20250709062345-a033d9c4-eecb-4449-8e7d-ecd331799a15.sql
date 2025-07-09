-- Update the RLS policy for reviews to work without profile linkage
DROP POLICY IF EXISTS "Customers and admins can create reviews" ON public.reviews;

-- Create a new policy that allows admins to create reviews for any booking
-- and customers to create reviews (simplified check)
CREATE POLICY "Allow reviews creation" ON public.reviews
FOR INSERT 
WITH CHECK (
  -- Allow admins to create reviews for any booking
  (EXISTS ( 
    SELECT 1
    FROM user_roles
    WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))
  ))
  OR
  -- Allow authenticated users to create reviews (simplified for now)
  (auth.uid() IS NOT NULL)
);