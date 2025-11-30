-- Insert service types (these appear as "Service Type" in the booking form)
INSERT INTO company_settings (setting_category, setting_key, setting_value, is_active, display_order)
VALUES 
  ('service_types', 'airbnb', '{"key": "airbnb", "label": "Airbnb Cleaning"}', true, 1),
  ('service_types', 'domestic', '{"key": "domestic", "label": "Domestic"}', true, 2),
  ('service_types', 'standard_cleaning', '{"key": "standard_cleaning", "label": "Standard Cleaning"}', true, 3),
  ('service_types', 'commercial', '{"key": "commercial", "label": "Commercial Cleaning"}', true, 4)
ON CONFLICT DO NOTHING;

-- Insert cleaning types (these appear as "Property Type" or sub-types)
INSERT INTO company_settings (setting_category, setting_key, setting_value, is_active, display_order)
VALUES 
  ('cleaning_types', 'checkin-checkout', '{"key": "checkin-checkout", "label": "Check-in/Check-out"}', true, 1),
  ('cleaning_types', 'check_in_check_out', '{"key": "check_in_check_out", "label": "Check-in/Check-out"}', true, 2),
  ('cleaning_types', 'domestic', '{"key": "domestic", "label": "Domestic"}', true, 3),
  ('cleaning_types', 'standard_cleaning', '{"key": "standard_cleaning", "label": "Standard Cleaning"}', true, 4),
  ('cleaning_types', 'commercial_cleaning', '{"key": "commercial_cleaning", "label": "Commercial Cleaning"}', true, 5)
ON CONFLICT DO NOTHING;