-- Drop the existing check constraint
ALTER TABLE airbnb_field_configs DROP CONSTRAINT IF EXISTS airbnb_field_configs_value_type_check;

-- Add new check constraint with more value types
ALTER TABLE airbnb_field_configs ADD CONSTRAINT airbnb_field_configs_value_type_check 
CHECK (value_type = ANY (ARRAY['fixed'::text, 'percentage'::text, 'hours'::text, 'currency'::text, 'counter'::text, 'boolean'::text, 'multiplier'::text]));

-- Add new columns to airbnb_field_configs
ALTER TABLE airbnb_field_configs 
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS label text,
ADD COLUMN IF NOT EXISTS max_value integer,
ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Update existing records to have display_order
UPDATE airbnb_field_configs SET display_order = 0 WHERE display_order IS NULL;

-- Insert Property Type options
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Property Type', 'flat', 'Flat', 0, 'fixed', 0, 'Building2', 1, true),
('Property Type', 'house', 'House', 0, 'fixed', 0, 'Home', 2, true)
ON CONFLICT DO NOTHING;

-- Insert Bedroom options
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, max_value, display_order, is_visible) VALUES
('Bedrooms', 'studio', 'Studio', 1, 'hours', 0, 'DoorClosed', null, 1, true),
('Bedrooms', '1', '1 Bedroom', 1.5, 'hours', 0, 'DoorClosed', null, 2, true),
('Bedrooms', '2', '2 Bedrooms', 2, 'hours', 0, 'DoorClosed', null, 3, true),
('Bedrooms', '3', '3 Bedrooms', 2.5, 'hours', 0, 'DoorClosed', null, 4, true),
('Bedrooms', '4', '4 Bedrooms', 3, 'hours', 0, 'DoorClosed', null, 5, true),
('Bedrooms', '5', '5 Bedrooms', 3.5, 'hours', 0, 'DoorClosed', null, 6, true),
('Bedrooms', '6+', '6+ Bedrooms', 4, 'hours', 0, 'DoorClosed', null, 7, true),
('Bedrooms', 'max', 'Max Bedrooms', 6, 'counter', 0, null, 6, 999, true)
ON CONFLICT DO NOTHING;

-- Insert Bathroom options  
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, max_value, display_order, is_visible) VALUES
('Bathrooms', '1', '1 Bathroom', 0.5, 'hours', 0, 'Bath', null, 1, true),
('Bathrooms', '2', '2 Bathrooms', 1, 'hours', 0, 'Bath', null, 2, true),
('Bathrooms', '3', '3 Bathrooms', 1.5, 'hours', 0, 'Bath', null, 3, true),
('Bathrooms', '4', '4 Bathrooms', 2, 'hours', 0, 'Bath', null, 4, true),
('Bathrooms', '5', '5 Bathrooms', 2.5, 'hours', 0, 'Bath', null, 5, true),
('Bathrooms', '6+', '6+ Bathrooms', 3, 'hours', 0, 'Bath', null, 6, true),
('Bathrooms', 'max', 'Max Bathrooms', 6, 'counter', 0, null, 6, 999, true)
ON CONFLICT DO NOTHING;

-- Insert Additional Rooms
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, max_value, display_order, is_visible) VALUES
('Additional Rooms', 'toilets', 'Toilets', 0.25, 'hours', 0, 'Bath', 5, 1, true),
('Additional Rooms', 'studyRooms', 'Study Rooms', 0.5, 'hours', 0, 'BookOpen', 5, 2, true),
('Additional Rooms', 'utilityRooms', 'Utility Rooms', 0.5, 'hours', 0, 'Wrench', 5, 3, true),
('Additional Rooms', 'otherRooms', 'Other Rooms', 0.5, 'hours', 0, 'Plus', 5, 4, true)
ON CONFLICT DO NOTHING;

-- Insert Property Features
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Property Features', 'separateKitchen', 'Separate Kitchen', 0, 'boolean', 0, 'UtensilsCrossed', 1, true),
('Property Features', 'livingRoom', 'Separate Living Room', 0, 'boolean', 0, 'Sofa', 2, true),
('Property Features', 'diningRoom', 'Dining Room', 0, 'boolean', 0, 'UtensilsCrossed', 3, true),
('Property Features', 'numberOfFloors', 'Number of Floors', 0, 'counter', 0, 'Building', 4, true)
ON CONFLICT DO NOTHING;

-- Insert Service Types
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Service Type', 'check-in/out', 'Check-in / Check-out', 1.2, 'multiplier', 0, 'CalendarCheck', 1, true),
('Service Type', 'mid-stay', 'Mid-stay Cleaning', 1.0, 'multiplier', 0, 'Sparkles', 2, true),
('Service Type', 'light', 'Light Cleaning', 0.8, 'multiplier', 0, 'Wind', 3, true),
('Service Type', 'deep', 'Deep Cleaning', 1.5, 'multiplier', 0, 'SparklesIcon', 4, true)
ON CONFLICT DO NOTHING;

-- Insert Oven Types
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Oven Type', 'single', 'Single Oven', 1, 'hours', 0, 'ChefHat', 1, true),
('Oven Type', 'double', 'Double Oven', 1.5, 'hours', 0, 'ChefHat', 2, true),
('Oven Type', 'range', 'Range Cooker', 2, 'hours', 0, 'ChefHat', 3, true),
('Oven Type', 'convection', 'Convection Oven', 1.2, 'hours', 0, 'ChefHat', 4, true)
ON CONFLICT DO NOTHING;

-- Insert Cleaning Products options
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Cleaning Products', 'client_provides', 'Client Provides', 0, 'currency', 0, 'Home', 1, true),
('Cleaning Products', 'cleaner_brings', 'Cleaner Brings (+£5)', 5, 'currency', 0, 'Sparkles', 2, true)
ON CONFLICT DO NOTHING;

-- Insert Equipment options
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Equipment', 'client_provides', 'Client Provides', 0, 'currency', 0, 'Home', 1, true),
('Equipment', 'cleaner_brings', 'Cleaner Brings (+£10)', 10, 'currency', 0, 'Wrench', 2, true)
ON CONFLICT DO NOTHING;

-- Insert Equipment Arrangement options
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Equipment Arrangement', 'ongoing', 'For Ongoing Service', 10, 'currency', 0, 'RefreshCw', 1, true),
('Equipment Arrangement', 'one-time', 'One-time Payment', 30, 'currency', 0, 'DollarSign', 2, true)
ON CONFLICT DO NOTHING;

-- Insert Property Already Cleaned options
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Property Already Cleaned', 'yes', 'Yes', 0, 'boolean', 0, 'CheckCircle', 1, true),
('Property Already Cleaned', 'no', 'No', 0, 'boolean', 0, 'XCircle', 2, true)
ON CONFLICT DO NOTHING;

-- Insert Oven Cleaning options
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, icon, display_order, is_visible) VALUES
('Oven Cleaning', 'yes', 'Yes', 0, 'boolean', 0, 'CheckCircle', 1, true),
('Oven Cleaning', 'no', 'No', 0, 'boolean', 0, 'XCircle', 2, true)
ON CONFLICT DO NOTHING;