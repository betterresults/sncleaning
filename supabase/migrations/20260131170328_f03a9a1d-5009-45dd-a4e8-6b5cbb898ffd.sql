-- Create a lightweight short_links table for various short URL needs
CREATE TABLE public.short_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code text NOT NULL UNIQUE,
  link_type text NOT NULL DEFAULT 'payment_collection',
  customer_id bigint REFERENCES public.customers(id),
  booking_id bigint REFERENCES public.bookings(id),
  metadata jsonb DEFAULT '{}',
  expires_at timestamp with time zone,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index for fast short_code lookups
CREATE INDEX idx_short_links_short_code ON public.short_links(short_code);
CREATE INDEX idx_short_links_customer_id ON public.short_links(customer_id);

-- Enable RLS
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Public can read short links (for resolution)
CREATE POLICY "Anyone can read short links for resolution"
ON public.short_links FOR SELECT
USING (true);

-- Admins can manage all short links
CREATE POLICY "Admins can manage all short links"
ON public.short_links FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
));

-- Sales agents can manage short links
CREATE POLICY "Sales agents can manage short links"
ON public.short_links FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));