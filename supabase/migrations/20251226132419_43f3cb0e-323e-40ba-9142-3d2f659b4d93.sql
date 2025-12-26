-- Create a security definer function to check if a cleaner is assigned to a booking
CREATE OR REPLACE FUNCTION public.is_cleaner_assigned_to_booking(_user_id uuid, _booking_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cleaner_payments cp
    JOIN profiles p ON cp.cleaner_id = p.cleaner_id
    WHERE p.user_id = _user_id
      AND p.cleaner_id IS NOT NULL
      AND cp.booking_id = _booking_id
  )
$$;

-- Create a security definer function to get cleaner_id from user_id
CREATE OR REPLACE FUNCTION public.get_user_cleaner_id(_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cleaner_id
  FROM profiles
  WHERE user_id = _user_id
    AND cleaner_id IS NOT NULL
  LIMIT 1
$$;

-- Create a security definer function to get customer_id from user_id
CREATE OR REPLACE FUNCTION public.get_user_customer_id(_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id
  FROM profiles
  WHERE user_id = _user_id
    AND customer_id IS NOT NULL
  LIMIT 1
$$;

-- Update the bookings RLS policy to use security definer functions
DROP POLICY IF EXISTS "Admins, sales agents, customers and cleaners can view bookings" ON public.bookings;

CREATE POLICY "Admins, sales agents, customers and cleaners can view bookings"
ON public.bookings
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (has_role(auth.uid(), 'sales_agent'::app_role) AND (created_by_user_id = auth.uid())) 
  OR (customer = get_user_customer_id(auth.uid()))
  OR (cleaner = get_user_cleaner_id(auth.uid()))
  OR is_cleaner_assigned_to_booking(auth.uid(), id)
);