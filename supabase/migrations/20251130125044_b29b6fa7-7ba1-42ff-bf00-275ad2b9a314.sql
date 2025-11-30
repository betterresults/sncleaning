-- Insert service types with SINGULAR category name
INSERT INTO company_settings (setting_category, setting_key, setting_value, is_active, display_order)
VALUES 
  ('service_type', 'airbnb', '{"key": "airbnb", "label": "Airbnb Cleaning", "badge_color": "bg-blue-500/10 text-blue-700 border-blue-200"}', true, 1),
  ('service_type', 'domestic', '{"key": "domestic", "label": "Domestic", "badge_color": "bg-green-500/10 text-green-700 border-green-200"}', true, 2),
  ('service_type', 'standard_cleaning', '{"key": "standard_cleaning", "label": "Standard Cleaning", "badge_color": "bg-purple-500/10 text-purple-700 border-purple-200"}', true, 3),
  ('service_type', 'commercial', '{"key": "commercial", "label": "Commercial Cleaning", "badge_color": "bg-orange-500/10 text-orange-700 border-orange-200"}', true, 4)
ON CONFLICT DO NOTHING;

-- Insert cleaning types with SINGULAR category name
INSERT INTO company_settings (setting_category, setting_key, setting_value, is_active, display_order)
VALUES 
  ('cleaning_type', 'checkin-checkout', '{"key": "checkin-checkout", "label": "Check-in/Check-out"}', true, 1),
  ('cleaning_type', 'check_in_check_out', '{"key": "check_in_check_out", "label": "Check-in/Check-out"}', true, 2),
  ('cleaning_type', 'domestic', '{"key": "domestic", "label": "Domestic"}', true, 3),
  ('cleaning_type', 'standard_cleaning', '{"key": "standard_cleaning", "label": "Standard Cleaning"}', true, 4),
  ('cleaning_type', 'commercial_cleaning', '{"key": "commercial_cleaning", "label": "Commercial Cleaning"}', true, 5)
ON CONFLICT DO NOTHING;