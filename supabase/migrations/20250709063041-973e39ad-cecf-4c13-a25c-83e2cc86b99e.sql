-- Fix the foreign key constraint issue for cleaning_photos
-- Drop the existing foreign key constraint that only references bookings table
ALTER TABLE public.cleaning_photos 
DROP CONSTRAINT IF EXISTS cleaning_photos_booking_id_fkey;

-- Don't add a new foreign key constraint since the booking could be in either table
-- Instead, we'll rely on application logic to ensure data integrity

-- Add an index for better performance when querying by booking_id
CREATE INDEX IF NOT EXISTS idx_cleaning_photos_booking_id 
ON public.cleaning_photos(booking_id);