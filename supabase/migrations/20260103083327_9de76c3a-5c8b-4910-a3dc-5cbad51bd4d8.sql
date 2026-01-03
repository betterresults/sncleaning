-- Add property_type configurations for End of Tenancy pricing
-- Set category_order to 0 so it appears first in the admin panel

INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, category_order, display_order, is_visible, is_active)
VALUES 
  ('property_type', 'flat', 'Flat', 0, 'fixed', 0, 0, 1, true, true),
  ('property_type', 'house', 'House', 0, 'fixed', 0, 0, 2, true, true),
  ('property_type', 'house-share', 'House Share', 0, 'fixed', 0, 0, 3, true, true);