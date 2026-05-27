
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id bigint,
  name text,
  email text,
  phone text,
  postcode text NOT NULL,
  service text NOT NULL,
  description text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quote_requests TO anon;
GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit quote requests"
ON public.quote_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins manage all quote requests"
ON public.quote_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sales agents manage all quote requests"
ON public.quote_requests FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'sales_agent'::app_role))
WITH CHECK (has_role(auth.uid(), 'sales_agent'::app_role));

CREATE POLICY "Customers view their own quote requests"
ON public.quote_requests FOR SELECT
TO authenticated
USING (customer_id IS NOT NULL AND customer_id = get_user_customer_id(auth.uid()));

CREATE TRIGGER quote_requests_updated_at
BEFORE UPDATE ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-request-photos', 'quote-request-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload quote request photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'quote-request-photos');

CREATE POLICY "Anyone can view quote request photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'quote-request-photos');

CREATE POLICY "Admins manage quote request photos"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'quote-request-photos' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'quote-request-photos' AND has_role(auth.uid(), 'admin'::app_role));
