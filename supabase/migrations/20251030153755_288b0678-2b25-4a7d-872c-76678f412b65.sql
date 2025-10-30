-- Create table for Airbnb pricing formulas
CREATE TABLE IF NOT EXISTS public.airbnb_pricing_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  elements JSONB NOT NULL,
  result_type TEXT NOT NULL CHECK (result_type IN ('cost', 'time', 'percentage')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for field configuration values
CREATE TABLE IF NOT EXISTS public.airbnb_field_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  option TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  value_type TEXT NOT NULL CHECK (value_type IN ('fixed', 'percentage')),
  time NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, option)
);

-- Enable RLS
ALTER TABLE public.airbnb_pricing_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airbnb_field_configs ENABLE ROW LEVEL SECURITY;

-- Admins can manage formulas
CREATE POLICY "Admins can manage pricing formulas"
ON public.airbnb_pricing_formulas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Everyone can view active formulas
CREATE POLICY "Everyone can view active formulas"
ON public.airbnb_pricing_formulas
FOR SELECT
USING (is_active = true);

-- Admins can manage field configs
CREATE POLICY "Admins can manage field configs"
ON public.airbnb_field_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Everyone can view active configs
CREATE POLICY "Everyone can view active configs"
ON public.airbnb_field_configs
FOR SELECT
USING (is_active = true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_airbnb_pricing_formulas_updated_at
BEFORE UPDATE ON public.airbnb_pricing_formulas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_airbnb_field_configs_updated_at
BEFORE UPDATE ON public.airbnb_field_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();