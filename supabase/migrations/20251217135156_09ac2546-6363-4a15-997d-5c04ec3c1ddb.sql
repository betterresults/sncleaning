-- Create coverage_regions table (top-level groupings)
CREATE TABLE public.coverage_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coverage_boroughs table (boroughs/cities within regions)
CREATE TABLE public.coverage_boroughs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id UUID NOT NULL REFERENCES public.coverage_regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(region_id, name)
);

-- Create postcode_prefixes table (individual postcode prefixes)
CREATE TABLE public.postcode_prefixes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  borough_id UUID NOT NULL REFERENCES public.coverage_boroughs(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL UNIQUE,
  domestic_cleaning BOOLEAN DEFAULT true,
  airbnb_cleaning BOOLEAN DEFAULT true,
  end_of_tenancy BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cleaner_coverage_areas table (junction table for cleaner coverage)
CREATE TABLE public.cleaner_coverage_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  borough_id UUID NOT NULL REFERENCES public.coverage_boroughs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cleaner_id, borough_id)
);

-- Enable RLS on all tables
ALTER TABLE public.coverage_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_boroughs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postcode_prefixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_coverage_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coverage_regions
CREATE POLICY "Everyone can view active regions" ON public.coverage_regions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all regions" ON public.coverage_regions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- RLS Policies for coverage_boroughs
CREATE POLICY "Everyone can view active boroughs" ON public.coverage_boroughs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all boroughs" ON public.coverage_boroughs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- RLS Policies for postcode_prefixes
CREATE POLICY "Everyone can view active postcode prefixes" ON public.postcode_prefixes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all postcode prefixes" ON public.postcode_prefixes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- RLS Policies for cleaner_coverage_areas
CREATE POLICY "Cleaners can view their own coverage areas" ON public.cleaner_coverage_areas
  FOR SELECT USING (cleaner_id IN (
    SELECT profiles.cleaner_id FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  ));

CREATE POLICY "Cleaners can manage their own coverage areas" ON public.cleaner_coverage_areas
  FOR ALL USING (cleaner_id IN (
    SELECT profiles.cleaner_id FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  ));

CREATE POLICY "Admins can manage all cleaner coverage areas" ON public.cleaner_coverage_areas
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Create indexes for better query performance
CREATE INDEX idx_coverage_boroughs_region ON public.coverage_boroughs(region_id);
CREATE INDEX idx_postcode_prefixes_borough ON public.postcode_prefixes(borough_id);
CREATE INDEX idx_postcode_prefixes_prefix ON public.postcode_prefixes(prefix);
CREATE INDEX idx_cleaner_coverage_areas_cleaner ON public.cleaner_coverage_areas(cleaner_id);
CREATE INDEX idx_cleaner_coverage_areas_borough ON public.cleaner_coverage_areas(borough_id);

-- Insert sample regions
INSERT INTO public.coverage_regions (name, display_order) VALUES
  ('Central London', 1),
  ('East London', 2),
  ('North London', 3),
  ('South London', 4),
  ('West London', 5),
  ('Essex', 6),
  ('Kent', 7),
  ('Hertfordshire', 8);

-- Insert sample boroughs for East London
INSERT INTO public.coverage_boroughs (region_id, name, display_order)
SELECT r.id, b.name, b.display_order
FROM public.coverage_regions r
CROSS JOIN (VALUES 
  ('Hackney', 1),
  ('Tower Hamlets', 2),
  ('Newham', 3),
  ('Waltham Forest', 4),
  ('Redbridge', 5),
  ('Barking & Dagenham', 6)
) AS b(name, display_order)
WHERE r.name = 'East London';

-- Insert sample postcodes for East London boroughs
INSERT INTO public.postcode_prefixes (borough_id, prefix)
SELECT b.id, p.prefix
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('E5'), ('E8'), ('E9'), ('N1'), ('N4'), ('N16')) AS p(prefix)
WHERE b.name = 'Hackney';

INSERT INTO public.postcode_prefixes (borough_id, prefix)
SELECT b.id, p.prefix
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('E1'), ('E2'), ('E3'), ('E14')) AS p(prefix)
WHERE b.name = 'Tower Hamlets';

INSERT INTO public.postcode_prefixes (borough_id, prefix)
SELECT b.id, p.prefix
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('E6'), ('E7'), ('E12'), ('E13'), ('E15'), ('E16')) AS p(prefix)
WHERE b.name = 'Newham';

INSERT INTO public.postcode_prefixes (borough_id, prefix)
SELECT b.id, p.prefix
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('E4'), ('E10'), ('E11'), ('E17')) AS p(prefix)
WHERE b.name = 'Waltham Forest';

INSERT INTO public.postcode_prefixes (borough_id, prefix)
SELECT b.id, p.prefix
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('IG1'), ('IG2'), ('IG3'), ('IG4'), ('IG5'), ('IG6')) AS p(prefix)
WHERE b.name = 'Redbridge';

INSERT INTO public.postcode_prefixes (borough_id, prefix)
SELECT b.id, p.prefix
FROM public.coverage_boroughs b
CROSS JOIN (VALUES ('IG11'), ('RM8'), ('RM9'), ('RM10')) AS p(prefix)
WHERE b.name = 'Barking & Dagenham';

-- Create updated_at triggers
CREATE TRIGGER update_coverage_regions_updated_at
  BEFORE UPDATE ON public.coverage_regions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coverage_boroughs_updated_at
  BEFORE UPDATE ON public.coverage_boroughs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_postcode_prefixes_updated_at
  BEFORE UPDATE ON public.postcode_prefixes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();