-- Update the SELECT policy on bookings to allow sales agents to view all bookings
DROP POLICY IF EXISTS "Admins and customers can view all bookings, sales agents see th" ON public.bookings;

CREATE POLICY "Admins, sales agents, customers and cleaners can view bookings"
ON public.bookings
FOR SELECT
USING (
  -- Admins can see all
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Sales agents can see all bookings (they need this for their tasks)
  public.has_role(auth.uid(), 'sales_agent'::app_role)
  OR
  -- Customers can see their own bookings
  customer IN (
    SELECT profiles.customer_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  )
  OR
  -- Cleaners can see bookings assigned to them
  cleaner IN (
    SELECT profiles.cleaner_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  )
);

-- Also update past_bookings to allow sales agents to view
DROP POLICY IF EXISTS "Admins and customers can view past bookings" ON public.past_bookings;

CREATE POLICY "Admins, sales agents, customers and cleaners can view past bookings"
ON public.past_bookings
FOR SELECT
USING (
  -- Admins can see all
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Sales agents can see all past bookings
  public.has_role(auth.uid(), 'sales_agent'::app_role)
  OR
  -- Customers can see their own past bookings
  customer IN (
    SELECT profiles.customer_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  )
  OR
  -- Cleaners can see past bookings assigned to them
  cleaner IN (
    SELECT profiles.cleaner_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  )
);