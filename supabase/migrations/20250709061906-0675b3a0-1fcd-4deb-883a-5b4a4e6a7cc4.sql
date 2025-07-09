-- Update the RLS policy for customers creating reviews to also allow admins
DROP POLICY IF EXISTS "Customers can create reviews for their bookings" ON public.reviews;

-- Create a new policy that allows both customers and admins to create reviews
CREATE POLICY "Customers and admins can create reviews" ON public.reviews
FOR INSERT 
WITH CHECK (
  -- Allow customers to create reviews for their own bookings
  (past_booking_id IN ( 
    SELECT pb.id
    FROM ((past_bookings pb
      JOIN customers c ON ((pb.customer = c.id)))
      JOIN profiles p ON ((p.customer_id = c.id)))
    WHERE (p.user_id = auth.uid())
  ))
  OR
  -- Allow admins to create reviews for any booking
  (EXISTS ( 
    SELECT 1
    FROM user_roles
    WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))
  ))
);