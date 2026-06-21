-- Add Stripe Checkout session tracking and booking payload snapshot to quote_leads
-- (reusing the existing leads/abandoned-booking table as the pending-payment store)
ALTER TABLE public.quote_leads
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS booking_payload jsonb,
  ADD COLUMN IF NOT EXISTS meta_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS quote_leads_stripe_checkout_session_id_key
  ON public.quote_leads (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Add the same session id on bookings so the confirmation page can poll for it
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_stripe_checkout_session_id_key
  ON public.bookings (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;