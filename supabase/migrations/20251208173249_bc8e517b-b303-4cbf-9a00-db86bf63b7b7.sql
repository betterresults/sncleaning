-- Insert domestic service type field configurations
-- Service Frequency options (instead of Airbnb service types)
INSERT INTO public.airbnb_field_configs (category, category_order, option, label, value, value_type, time, display_order, is_active, is_visible)
VALUES
  ('Domestic Service Frequency', 100, 'weekly', 'Weekly', 20, 'fixed', 1.0, 1, true, true),
  ('Domestic Service Frequency', 100, 'biweekly', 'Biweekly', 22, 'fixed', 1.0, 2, true, true),
  ('Domestic Service Frequency', 100, 'monthly', 'Monthly', 24, 'fixed', 1.0, 3, true, true),
  ('Domestic Service Frequency', 100, 'onetime', 'One-time', 26, 'fixed', 1.0, 4, true, true);

-- Add domestic service pricing formula
INSERT INTO public.service_pricing_formulas (service_type, formula_name, formula_config, base_hourly_rate, is_active)
VALUES 
  ('domestic-cleaning', 'Domestic Cleaning Standard', 
   '{"baseRate": 22, "frequencyMultipliers": {"weekly": 0.9, "biweekly": 0.95, "monthly": 1.0, "onetime": 1.1}}', 
   22, true)
ON CONFLICT DO NOTHING;