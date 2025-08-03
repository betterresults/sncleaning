-- Add has_photos field to past_bookings table to track photo availability
ALTER TABLE public.past_bookings 
ADD COLUMN IF NOT EXISTS has_photos boolean DEFAULT false;

-- Create function to update has_photos status when photos are uploaded
CREATE OR REPLACE FUNCTION public.update_booking_photos_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update past_bookings table to indicate photos are available
    UPDATE public.past_bookings 
    SET has_photos = true 
    WHERE id = NEW.booking_id;
    
    -- If booking is still in upcoming bookings, also mark it there
    UPDATE public.bookings 
    SET has_photos = true 
    WHERE id = NEW.booking_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update has_photos when photos are uploaded
DROP TRIGGER IF EXISTS trigger_update_photos_status ON public.cleaning_photos;
CREATE TRIGGER trigger_update_photos_status
    AFTER INSERT ON public.cleaning_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_booking_photos_status();

-- Also add has_photos to bookings table for upcoming bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS has_photos boolean DEFAULT false;

-- Update existing records where photos already exist
UPDATE public.past_bookings 
SET has_photos = true 
WHERE id IN (
    SELECT DISTINCT booking_id 
    FROM public.cleaning_photos
);

UPDATE public.bookings 
SET has_photos = true 
WHERE id IN (
    SELECT DISTINCT booking_id 
    FROM public.cleaning_photos
);