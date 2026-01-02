-- Step 1: Drop the foreign key constraint so cleaner_payments records persist
-- when bookings move to past_bookings
ALTER TABLE cleaner_payments 
DROP CONSTRAINT IF EXISTS booking_cleaners_booking_id_fkey;

-- Step 2: Migrate historical cleaner pay data from past_bookings
-- This inserts records for all past bookings that have cleaner pay assigned
INSERT INTO cleaner_payments (
  booking_id, 
  cleaner_id, 
  is_primary, 
  payment_type,
  calculated_pay, 
  hours_assigned, 
  status, 
  created_at
)
SELECT 
  pb.id,
  pb.cleaner,
  true,
  'fixed',
  pb.cleaner_pay,
  COALESCE(pb.total_hours, pb.hours_required),
  'completed',
  COALESCE(pb.date_time::timestamptz, now())
FROM past_bookings pb
WHERE pb.cleaner_pay IS NOT NULL 
  AND pb.cleaner_pay > 0
  AND pb.cleaner IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM cleaner_payments cp WHERE cp.booking_id = pb.id
  );