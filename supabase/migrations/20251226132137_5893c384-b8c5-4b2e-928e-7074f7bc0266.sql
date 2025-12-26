-- Drop the sub_bookings table and related objects
DROP FUNCTION IF EXISTS move_sub_bookings_to_past();

-- Update the bookings RLS policy to use cleaner_payments instead of sub_bookings
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
    WHERE ((profiles.user_id = auth.uid()) AND (profiles.customer_id IS NOT NULL))
  )) 
  OR (cleaner IN ( 
    SELECT profiles.cleaner_id
    FROM profiles
    WHERE ((profiles.user_id = auth.uid()) AND (profiles.cleaner_id IS NOT NULL))
  )) 
  OR (id IN ( 
    SELECT cleaner_payments.booking_id
    FROM cleaner_payments
    WHERE (cleaner_payments.cleaner_id IN ( 
      SELECT profiles.cleaner_id
      FROM profiles
      WHERE ((profiles.user_id = auth.uid()) AND (profiles.cleaner_id IS NOT NULL))
    ))
  ))
);

-- Now drop the sub_bookings table
DROP TABLE IF EXISTS public.sub_bookings;