-- Update House Share Room Types (replace generic Bedroom with specific types)
DELETE FROM end_of_tenancy_field_configs WHERE category = 'house_share_areas' AND option = 'bedroom';

INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, display_order, category_order, is_visible, is_active)
VALUES 
  ('house_share_areas', 'single_bedroom', 'Single Bedroom', 59, 'fixed', 1, 1, 5, true, true),
  ('house_share_areas', 'double_bedroom', 'Double Bedroom', 69, 'fixed', 1.25, 2, 5, true, true),
  ('house_share_areas', 'master_bedroom', 'Master Bedroom', 89, 'fixed', 1.5, 3, 5, true, true);

-- Update Additional Rooms Prices
UPDATE end_of_tenancy_field_configs SET value = 39 WHERE category = 'additional_rooms' AND option = 'dining';
UPDATE end_of_tenancy_field_configs SET value = 29 WHERE category = 'additional_rooms' AND option = 'study';
UPDATE end_of_tenancy_field_configs SET value = 29 WHERE category = 'additional_rooms' AND option = 'utility';
UPDATE end_of_tenancy_field_configs SET value = 69 WHERE category = 'additional_rooms' AND option = 'conservatory';

-- Add missing Additional Rooms
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, display_order, category_order, is_visible, is_active)
VALUES 
  ('additional_rooms', 'toilet', 'Toilet', 20, 'fixed', 0.25, 10, 4, true, true),
  ('additional_rooms', 'other_room', 'Any Other Additional Room', 35, 'fixed', 0.5, 11, 4, true, true);

-- Update Oven Cleaning Prices
UPDATE end_of_tenancy_field_configs SET value = 59 WHERE category = 'oven_cleaning' AND option = 'double_oven';
UPDATE end_of_tenancy_field_configs SET value = 109 WHERE category = 'oven_cleaning' AND option = 'range_oven';

-- Add missing Oven options
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, display_order, category_order, is_visible, is_active)
VALUES 
  ('oven_cleaning', 'single_convection_oven', 'Single and Convection Oven', 69, 'fixed', 1, 3, 6, true, true),
  ('oven_cleaning', 'aga_oven', 'AGA Oven', 129, 'fixed', 2, 5, 6, true, true);

-- Add Missing Services (new category: additional_services)
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, display_order, category_order, is_visible, is_active)
VALUES 
  ('additional_services', 'balcony_cleaning', 'Balcony Cleaning', 39, 'fixed', 0.5, 1, 10, true, true),
  ('additional_services', 'garage_cleaning', 'Garage Cleaning', 59, 'fixed', 1, 2, 10, true, true),
  ('additional_services', 'waste_removal', 'Household Waste Removal', 59, 'fixed', 0.5, 3, 10, true, true);