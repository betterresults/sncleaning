-- Add discount column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;

-- Add discount column to past_bookings table for consistency
ALTER TABLE public.past_bookings ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;