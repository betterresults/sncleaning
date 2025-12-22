-- Soft-delete old combined bedroom/bathroom entries
UPDATE end_of_tenancy_field_configs 
SET is_active = false 
WHERE category = 'base_price';

-- Insert separate BEDROOMS category
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, category_order, display_order, is_visible, is_active) VALUES
('bedrooms', 'studio', 'Studio', 80, 'fixed', 120, 1, 1, true, true),
('bedrooms', '1', '1 Bedroom', 100, 'fixed', 150, 1, 2, true, true),
('bedrooms', '2', '2 Bedrooms', 130, 'fixed', 180, 1, 3, true, true),
('bedrooms', '3', '3 Bedrooms', 160, 'fixed', 210, 1, 4, true, true),
('bedrooms', '4', '4 Bedrooms', 200, 'fixed', 240, 1, 5, true, true),
('bedrooms', '5', '5 Bedrooms', 250, 'fixed', 300, 1, 6, true, true),
('bedrooms', '6+', '6+ Bedrooms', 320, 'fixed', 360, 1, 7, true, true);

-- Insert separate BATHROOMS category
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, category_order, display_order, is_visible, is_active) VALUES
('bathrooms', '1', '1 Bathroom', 30, 'fixed', 30, 2, 1, true, true),
('bathrooms', '2', '2 Bathrooms', 55, 'fixed', 55, 2, 2, true, true),
('bathrooms', '3', '3 Bathrooms', 80, 'fixed', 80, 2, 3, true, true),
('bathrooms', '4', '4 Bathrooms', 100, 'fixed', 100, 2, 4, true, true),
('bathrooms', '5', '5 Bathrooms', 120, 'fixed', 120, 2, 5, true, true),
('bathrooms', '6+', '6+ Bathrooms', 150, 'fixed', 150, 2, 6, true, true);

-- Insert PROPERTY CONDITION category (percentage surcharges)
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, category_order, display_order, is_visible, is_active) VALUES
('property_condition', 'well-maintained', 'Well-Maintained', 0, 'percentage', 0, 3, 1, true, true),
('property_condition', 'moderate', 'Moderate Condition', 10, 'percentage', 30, 3, 2, true, true),
('property_condition', 'heavily-used', 'Heavily Used', 20, 'percentage', 60, 3, 3, true, true),
('property_condition', 'intensive', 'Intensive Cleaning Required', 35, 'percentage', 90, 3, 4, true, true);

-- Insert FURNITURE STATUS category
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, category_order, display_order, is_visible, is_active) VALUES
('furniture_status', 'unfurnished', 'Unfurnished', 0, 'percentage', 0, 4, 1, true, true),
('furniture_status', 'part-furnished', 'Part Furnished', 10, 'percentage', 30, 4, 2, true, true),
('furniture_status', 'furnished', 'Furnished', 20, 'percentage', 60, 4, 3, true, true);

-- Insert KITCHEN/LIVING LAYOUT category
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, category_order, display_order, is_visible, is_active) VALUES
('kitchen_living_layout', 'separate', 'Separate Rooms', 0, 'fixed', 0, 5, 1, true, true),
('kitchen_living_layout', 'open_plan', 'Open Plan', 15, 'fixed', 15, 5, 2, true, true);

-- Insert HOUSE SHARE AREAS category
INSERT INTO end_of_tenancy_field_configs (category, option, label, value, value_type, time, category_order, display_order, is_visible, is_active) VALUES
('house_share_areas', 'bedroom', 'Bedroom', 50, 'fixed', 45, 7, 1, true, true),
('house_share_areas', 'bathroom', 'Bathroom', 35, 'fixed', 30, 7, 2, true, true),
('house_share_areas', 'kitchen-shared', 'Kitchen (Shared)', 40, 'fixed', 35, 7, 3, true, true),
('house_share_areas', 'living-shared', 'Living Room (Shared)', 35, 'fixed', 30, 7, 4, true, true);

-- Update category_order for existing categories
UPDATE end_of_tenancy_field_configs SET category_order = 6 WHERE category = 'additional_rooms';
UPDATE end_of_tenancy_field_configs SET category_order = 8 WHERE category = 'oven_cleaning';
UPDATE end_of_tenancy_field_configs SET category_order = 9 WHERE category = 'blinds';
UPDATE end_of_tenancy_field_configs SET category_order = 10 WHERE category = 'extras';
UPDATE end_of_tenancy_field_configs SET category_order = 11 WHERE category = 'carpet';
UPDATE end_of_tenancy_field_configs SET category_order = 12 WHERE category = 'upholstery';
UPDATE end_of_tenancy_field_configs SET category_order = 13 WHERE category = 'mattress';