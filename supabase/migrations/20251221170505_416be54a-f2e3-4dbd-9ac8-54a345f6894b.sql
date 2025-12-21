-- Add policy for sub-cleaners to view their own sub_bookings
CREATE POLICY "Cleaners can view their own sub bookings"
ON public.sub_bookings
FOR SELECT
USING (cleaner_id IN (
  SELECT profiles.cleaner_id
  FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
));

-- Drop the existing bookings SELECT policy and recreate with sub_bookings check
DROP POLICY IF EXISTS "Admins, sales agents, customers and cleaners can view bookings" ON public.bookings;

CREATE POLICY "Admins, sales agents, customers and cleaners can view bookings"
ON public.bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (has_role(auth.uid(), 'sales_agent'::app_role) AND (created_by_user_id = auth.uid())) 
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
  OR (id IN (
    SELECT sub_bookings.primary_booking_id
    FROM sub_bookings
    WHERE sub_bookings.cleaner_id IN (
      SELECT profiles.cleaner_id
      FROM profiles
      WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
    )
  ))
);