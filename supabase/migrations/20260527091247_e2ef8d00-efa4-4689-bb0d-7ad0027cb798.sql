ALTER TABLE public.quote_requests
  ADD COLUMN quoted_price NUMERIC NULL,
  ADD COLUMN quote_message TEXT NULL,
  ADD COLUMN quoted_at TIMESTAMPTZ NULL;