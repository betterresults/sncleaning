-- Add same_day boolean field to bookings table
ALTER TABLE public.bookings ADD COLUMN same_day BOOLEAN DEFAULT FALSE;

-- Add same_day field to past_bookings table as well for consistency
ALTER TABLE public.past_bookings ADD COLUMN same_day TEXT DEFAULT 'false';