
-- Fix duplicate booking ID 110703 - simplified approach for identity column

-- Step 1: Drop the foreign key constraint temporarily
ALTER TABLE public.cleaner_tracking 
DROP CONSTRAINT IF EXISTS cleaner_tracking_booking_id_fkey;

-- Step 2: Update the booking ID from 110703 to 110704 for customer 12, Nov 6
UPDATE public.bookings 
SET id = 110704
WHERE id = 110703 
  AND customer = 12 
  AND date_time::date = '2025-11-06';

-- Step 3: Update cleaner_tracking records to match new booking ID
UPDATE public.cleaner_tracking 
SET booking_id = 110704
WHERE booking_id = 110703 
  AND cleaner_id = 1
  AND check_in_time::date = '2025-11-06';

-- Step 4: Recreate the foreign key constraint
ALTER TABLE public.cleaner_tracking
ADD CONSTRAINT cleaner_tracking_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES public.bookings(id) 
ON DELETE CASCADE;

-- Step 5: Reset the identity sequence to prevent future conflicts
-- Identity columns manage their own sequence, so we restart it
ALTER TABLE public.bookings 
ALTER COLUMN id RESTART WITH 110705;

-- Add a comment explaining the fix
COMMENT ON COLUMN public.bookings.id IS 'Identity column restarted on 2025-11-06 to fix duplicate ID conflict between bookings and past_bookings tables';
