
ALTER TABLE public.quote_leads
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS landing_url text;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS meta_capi_sent_at timestamptz;
