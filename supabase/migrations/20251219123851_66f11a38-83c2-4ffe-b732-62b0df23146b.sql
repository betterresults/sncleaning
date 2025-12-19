-- Drop the existing SELECT policy for bookings
DROP POLICY IF EXISTS "Admins, sales agents, customers and cleaners can view bookings" ON public.bookings;

-- Create updated policy: sales agents only see their own created bookings
CREATE POLICY "Admins, sales agents, customers and cleaners can view bookings"
ON public.bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (has_role(auth.uid(), 'sales_agent'::app_role) AND created_by_user_id = auth.uid())
  OR (customer IN ( 
    SELECT profiles.customer_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  )) 
  OR (cleaner IN ( 
    SELECT profiles.cleaner_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  ))
);