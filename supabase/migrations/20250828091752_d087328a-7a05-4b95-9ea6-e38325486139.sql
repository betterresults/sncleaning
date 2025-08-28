-- Remove the foreign key constraint that's causing photo upload failures
-- This constraint is breaking when bookings are moved to past_bookings table
ALTER TABLE photo_completion_notifications 
DROP CONSTRAINT IF EXISTS photo_completion_notifications_booking_id_fkey;

-- The booking_id column will remain as a regular bigint column without foreign key constraint
-- This allows notifications to work for both active and completed bookings