-- Sync has_photos field in past_bookings based on existing photos
UPDATE past_bookings 
SET has_photos = CASE 
  WHEN EXISTS (
    SELECT 1 FROM cleaning_photos 
    WHERE cleaning_photos.booking_id = past_bookings.id
  ) THEN true 
  ELSE false 
END;