ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2) DEFAULT 0;
ALTER TABLE public.past_bookings ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2) DEFAULT 0;