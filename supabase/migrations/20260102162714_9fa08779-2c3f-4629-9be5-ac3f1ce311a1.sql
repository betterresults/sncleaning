-- Convert date_submited to timestamp and add default
ALTER TABLE public.bookings 
ALTER COLUMN date_submited SET DEFAULT now()::text;

-- Backfill existing NULL values with date_time or current time
UPDATE public.bookings 
SET date_submited = COALESCE(date_time::text, now()::text)
WHERE date_submited IS NULL;