
-- Populate time_only for existing bookings that have date_time but missing time_only
UPDATE bookings 
SET time_only = (date_time AT TIME ZONE 'UTC')::time
WHERE date_time IS NOT NULL 
  AND time_only IS NULL;

-- Also populate date_only for bookings that are missing it but have date_time
UPDATE bookings
SET date_only = (date_time AT TIME ZONE 'UTC')::date
WHERE date_time IS NOT NULL
  AND date_only IS NULL;
