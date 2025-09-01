-- Create trigger to automatically update has_photos flag when photos are uploaded
CREATE TRIGGER update_has_photos_on_photo_upload
    AFTER INSERT ON public.cleaning_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_booking_photos_status();

-- Update has_photos flag for all existing bookings that have photos but flag is false
UPDATE public.past_bookings 
SET has_photos = true 
WHERE id IN (
    SELECT DISTINCT booking_id 
    FROM public.cleaning_photos
) AND has_photos = false;

UPDATE public.bookings 
SET has_photos = true 
WHERE id IN (
    SELECT DISTINCT booking_id 
    FROM public.cleaning_photos
) AND has_photos = false;