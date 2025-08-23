-- Create table for Airbnb field pricing configuration
CREATE TABLE IF NOT EXISTS public.airbnb_field_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  base_cost NUMERIC DEFAULT 0,
  multiplier_factor NUMERIC DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  pricing_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.airbnb_field_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all airbnb pricing" 
ON public.airbnb_field_pricing 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Authenticated users can view airbnb pricing" 
ON public.airbnb_field_pricing 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert default pricing configuration
INSERT INTO public.airbnb_field_pricing (field_name, field_value, base_cost, multiplier_factor) VALUES
-- Property Types
('property_type', 'flat', 30, 1.0),
('property_type', 'house', 40, 1.0),
('property_type', 'studio', 25, 1.0),

-- Bedrooms
('bedrooms', '1', 15, 1.0),
('bedrooms', '2', 25, 1.0),
('bedrooms', '3', 35, 1.0),
('bedrooms', '4', 45, 1.0),
('bedrooms', '5', 55, 1.0),

-- Bathrooms
('bathrooms', '1', 10, 1.0),
('bathrooms', '2', 18, 1.0),
('bathrooms', '3', 26, 1.0),
('bathrooms', '4', 34, 1.0),

-- Service Types
('service_type', 'check_in_out', 0, 1.0),
('service_type', 'mid_stay', 0, 0.8),
('service_type', 'light_cleaning', 0, 0.6),
('service_type', 'deep_cleaning', 0, 1.5),

-- Add-ons
('cleaning_products', 'bring_own', 10, 1.0),
('cleaning_products', 'i_provide', 0, 1.0),
('ironing_required', 'true', 15, 1.0),
('ironing_required', 'false', 0, 1.0),
('same_day_cleaning', 'true', 0, 1.2),
('same_day_cleaning', 'false', 0, 1.0);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_airbnb_pricing_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_airbnb_field_pricing_updated_at
BEFORE UPDATE ON public.airbnb_field_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_airbnb_pricing_updated_at_column();