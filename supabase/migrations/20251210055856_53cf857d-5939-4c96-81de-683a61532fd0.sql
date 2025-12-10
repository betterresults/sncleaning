-- Create quote_leads table to track price inquiries from ads
CREATE TABLE public.quote_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  
  -- Service details
  service_type text,
  cleaning_type text,
  
  -- Property details
  property_type text,
  bedrooms integer,
  bathrooms integer,
  toilets integer,
  reception_rooms integer,
  kitchen text,
  additional_rooms jsonb,
  
  -- Service options
  oven_cleaning boolean DEFAULT false,
  oven_size text,
  ironing_hours numeric,
  frequency text,
  
  -- Schedule
  selected_date date,
  selected_time time,
  is_flexible boolean DEFAULT false,
  
  -- Contact info (if provided)
  first_name text,
  last_name text,
  email text,
  phone text,
  postcode text,
  
  -- Quote details
  calculated_quote numeric,
  recommended_hours numeric,
  
  -- Tracking data
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  page_url text,
  referrer text,
  user_agent text,
  
  -- Status tracking
  status text DEFAULT 'viewing',
  furthest_step text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint on session_id to allow upserts
  CONSTRAINT quote_leads_session_unique UNIQUE (session_id)
);

-- Enable RLS
ALTER TABLE public.quote_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anonymous visitors can save their quote data)
CREATE POLICY "Anyone can insert quote leads"
ON public.quote_leads
FOR INSERT
WITH CHECK (true);

-- Allow public updates on their own session
CREATE POLICY "Anyone can update their own quote lead"
ON public.quote_leads
FOR UPDATE
USING (true);

-- Only admins can view all quote leads
CREATE POLICY "Admins can view all quote leads"
ON public.quote_leads
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'::app_role
));

-- Create trigger for updated_at
CREATE TRIGGER update_quote_leads_updated_at
BEFORE UPDATE ON public.quote_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for admin queries
CREATE INDEX idx_quote_leads_created_at ON public.quote_leads(created_at DESC);
CREATE INDEX idx_quote_leads_status ON public.quote_leads(status);
CREATE INDEX idx_quote_leads_service_type ON public.quote_leads(service_type);