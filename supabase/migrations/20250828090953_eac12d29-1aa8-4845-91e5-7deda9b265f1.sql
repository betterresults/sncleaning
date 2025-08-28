-- Add unique constraint on booking_id to prevent duplicate notification records
-- This will ensure only one notification record per booking can exist
ALTER TABLE photo_completion_notifications 
ADD CONSTRAINT unique_booking_notification 
UNIQUE (booking_id);