-- Add RLS policy for cleaners to view past_bookings they have payments for
-- This covers cases where a cleaner is assigned via cleaner_payments but not as the primary cleaner in past_bookings.cleaner field

CREATE POLICY "Cleaners can view past_bookings for their payment records"
ON public.past_bookings
FOR SELECT
USING (
  id IN (
    SELECT cp.booking_id 
    FROM cleaner_payments cp
    JOIN profiles p ON p.cleaner_id = cp.cleaner_id
    WHERE p.user_id = auth.uid()
    AND p.cleaner_id IS NOT NULL
  )
);