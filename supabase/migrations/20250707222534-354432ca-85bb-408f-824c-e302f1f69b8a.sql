-- Create service pricing formulas table
CREATE TABLE public.service_pricing_formulas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type TEXT NOT NULL,
  sub_service_type TEXT,
  formula_name TEXT NOT NULL,
  formula_config JSONB NOT NULL,
  base_hourly_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer specific pricing overrides table
CREATE TABLE public.customer_pricing_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  service_type TEXT NOT NULL,
  sub_service_type TEXT,
  override_formula_config JSONB,
  override_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_pricing_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_pricing_overrides ENABLE ROW LEVEL SECURITY;

-- Create policies for service_pricing_formulas
CREATE POLICY "Admins can manage all pricing formulas" 
ON public.service_pricing_formulas 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "All authenticated users can view pricing formulas" 
ON public.service_pricing_formulas 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policies for customer_pricing_overrides
CREATE POLICY "Admins can manage all customer pricing overrides" 
ON public.customer_pricing_overrides 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_pricing_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_service_pricing_formulas_updated_at
BEFORE UPDATE ON public.service_pricing_formulas
FOR EACH ROW
EXECUTE FUNCTION public.update_pricing_updated_at_column();

CREATE TRIGGER update_customer_pricing_overrides_updated_at
BEFORE UPDATE ON public.customer_pricing_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_pricing_updated_at_column();

-- Insert default Airbnb pricing formulas
INSERT INTO public.service_pricing_formulas (service_type, sub_service_type, formula_name, formula_config, base_hourly_rate) VALUES
('Airbnb', 'Standard', 'Standard Airbnb Cleaning', '{"baseFormula": "hours_required * base_hourly_rate", "conditions": []}', 25),
('Airbnb', 'Mid-stay', 'Mid-stay Cleaning', '{"baseFormula": "hours_required * base_hourly_rate * 0.8", "conditions": []}', 25),
('Airbnb', 'Deep', 'Deep Cleaning', '{"baseFormula": "hours_required * base_hourly_rate * 1.5", "conditions": []}', 25),
('Standard', null, 'Standard Cleaning', '{"baseFormula": "hours_required * base_hourly_rate", "conditions": []}', 20);