-- Rename booking_cleaners table to cleaner_payments
ALTER TABLE public.booking_cleaners RENAME TO cleaner_payments;

-- Rename indexes
ALTER INDEX idx_booking_cleaners_booking_id RENAME TO idx_cleaner_payments_booking_id;
ALTER INDEX idx_booking_cleaners_cleaner_id RENAME TO idx_cleaner_payments_cleaner_id;

-- Rename trigger
ALTER TRIGGER update_booking_cleaners_updated_at ON public.cleaner_payments RENAME TO update_cleaner_payments_updated_at;

-- Drop and recreate RLS policies with new names
DROP POLICY IF EXISTS "Admins can manage all booking_cleaners" ON public.cleaner_payments;
DROP POLICY IF EXISTS "Sales agents can manage booking_cleaners" ON public.cleaner_payments;
DROP POLICY IF EXISTS "Cleaners can view their own assignments" ON public.cleaner_payments;
DROP POLICY IF EXISTS "Customers can view cleaners on their bookings" ON public.cleaner_payments;

CREATE POLICY "Admins can manage all cleaner_payments"
ON public.cleaner_payments FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

CREATE POLICY "Sales agents can manage cleaner_payments"
ON public.cleaner_payments FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'sales_agent'
));

CREATE POLICY "Cleaners can view their own assignments"
ON public.cleaner_payments FOR SELECT
USING (cleaner_id IN (
  SELECT profiles.cleaner_id FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.cleaner_id IS NOT NULL
));

CREATE POLICY "Customers can view cleaners on their bookings"
ON public.cleaner_payments FOR SELECT
USING (booking_id IN (
  SELECT b.id FROM bookings b
  WHERE b.customer IN (
    SELECT profiles.customer_id FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.customer_id IS NOT NULL
  )
));