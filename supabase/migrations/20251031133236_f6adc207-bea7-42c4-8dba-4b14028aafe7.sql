-- Fix category_order to be unique for each category
UPDATE airbnb_field_configs SET category_order = 6 WHERE category = 'Service Type';
UPDATE airbnb_field_configs SET category_order = 7 WHERE category = 'Cleaning History';
UPDATE airbnb_field_configs SET category_order = 8 WHERE category = 'Oven Cleaning';
UPDATE airbnb_field_configs SET category_order = 9 WHERE category = 'Linen Handling';
UPDATE airbnb_field_configs SET category_order = 10 WHERE category = 'Ironing';
UPDATE airbnb_field_configs SET category_order = 11 WHERE category = 'Cleaning Products';
UPDATE airbnb_field_configs SET category_order = 12 WHERE category = 'Equipment';
UPDATE airbnb_field_configs SET category_order = 13 WHERE category = 'Equipment Arrangement';
UPDATE airbnb_field_configs SET category_order = 14 WHERE category = 'Time Flexibility';

-- Also update legacy category names to match the form
UPDATE airbnb_field_configs SET category = 'Cleaning History' WHERE category = 'Property Already Cleaned';
UPDATE airbnb_field_configs SET category = 'Oven Type' WHERE category = 'Oven Cleaning' AND option IN ('yes', 'no');
UPDATE airbnb_field_configs SET category_order = 8, category = 'Oven Cleaning' WHERE category = 'Oven Type' AND option IN ('single', 'double', 'range', 'convection');