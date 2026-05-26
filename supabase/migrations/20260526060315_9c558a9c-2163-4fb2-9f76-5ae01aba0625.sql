ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_failed_invoice_id text;

ALTER TABLE public.past_bookings
  ADD COLUMN IF NOT EXISTS payment_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_failed_invoice_id text;