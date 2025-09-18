-- Fix RLS on past_bookings table to resolve linter error
ALTER TABLE public.past_bookings ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policy for past_bookings (allowing authenticated users to read their related data)
CREATE POLICY "Users can view related past bookings" ON public.past_bookings
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Admins can see all
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') OR
    -- Cleaners can see their bookings
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND cleaner_id = past_bookings.cleaner) OR
    -- Customers can see their bookings
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND customer_id = past_bookings.customer)
  )
);