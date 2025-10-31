-- Add missing fields for complete Airbnb booking configuration

-- Linen Management (чаршафи/линени)
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, min_value, max_value, icon, is_visible, display_order, category_order)
VALUES
('Linen Management', 'none', 'No Linen Service', 0, 'none', 0, NULL, NULL, 'Bed', true, 1, 50),
('Linen Management', 'full_service', 'Full Service (Change & Fold)', 15, 'fixed', 30, NULL, NULL, 'Bed', true, 2, 50),
('Linen Management', 'change_only', 'Change Only', 10, 'fixed', 20, NULL, NULL, 'Bed', true, 3, 50);

-- Same Day / Last Minute Booking (<24h)
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, min_value, max_value, icon, is_visible, display_order, category_order)
VALUES
('Booking Timing', 'same_day', 'Same Day (<24h)', 40, 'percentage', 0, NULL, NULL, 'Clock', true, 1, 55),
('Booking Timing', 'advance', 'Advance Booking', 0, 'none', 0, NULL, NULL, 'Calendar', true, 2, 55);

-- Ironing Service
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, min_value, max_value, icon, is_visible, display_order, category_order)
VALUES
('Ironing', 'none', 'No Ironing', 0, 'none', 0, NULL, NULL, 'Shirt', true, 1, 60),
('Ironing', 'light', 'Light Ironing (1h)', 15, 'fixed', 60, NULL, NULL, 'Shirt', true, 2, 60),
('Ironing', 'medium', 'Medium Ironing (2h)', 30, 'fixed', 120, NULL, NULL, 'Shirt', true, 3, 60),
('Ironing', 'heavy', 'Heavy Ironing (3h)', 45, 'fixed', 180, NULL, NULL, 'Shirt', true, 4, 60),
('Ironing', 'custom_hours', 'Custom Hours', 15, 'fixed', 60, 0, 10, 'Shirt', true, 5, 60);

-- Property Occupancy (дали е заето)
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, min_value, max_value, icon, is_visible, display_order, category_order)
VALUES
('Property Occupancy', 'vacant', 'Vacant Property', 0, 'none', 0, NULL, NULL, 'Home', true, 1, 65),
('Property Occupancy', 'occupied', 'Occupied (+20%)', 20, 'percentage', 0, NULL, NULL, 'Users', true, 2, 65);

-- First Time Cleaning
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, min_value, max_value, icon, is_visible, display_order, category_order)
VALUES
('Cleaning History', 'regular', 'Regular Cleaning', 0, 'none', 0, NULL, NULL, 'RotateCcw', true, 1, 70),
('Cleaning History', 'first_time', 'First Time (+50%)', 50, 'percentage', 60, NULL, NULL, 'Sparkles', true, 2, 70);

-- Booking Frequency (за recurring отстъпки)
INSERT INTO airbnb_field_configs (category, option, label, value, value_type, time, min_value, max_value, icon, is_visible, display_order, category_order)
VALUES
('Booking Frequency', 'one_time', 'One-time', 0, 'none', 0, NULL, NULL, 'Calendar', true, 1, 75),
('Booking Frequency', 'weekly', 'Weekly (-10%)', -10, 'percentage', 0, NULL, NULL, 'CalendarDays', true, 2, 75),
('Booking Frequency', 'biweekly', 'Bi-weekly (-5%)', -5, 'percentage', 0, NULL, NULL, 'CalendarDays', true, 3, 75),
('Booking Frequency', 'monthly', 'Monthly', 0, 'none', 0, NULL, NULL, 'CalendarDays', true, 4, 75);