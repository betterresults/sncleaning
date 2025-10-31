-- Reorder categories to match the form sequence
UPDATE airbnb_field_configs SET category_order = 1 WHERE category = 'Property Type';
UPDATE airbnb_field_configs SET category_order = 2 WHERE category = 'Bedrooms';
UPDATE airbnb_field_configs SET category_order = 3 WHERE category = 'Bathrooms';
UPDATE airbnb_field_configs SET category_order = 4 WHERE category = 'Additional Rooms';
UPDATE airbnb_field_configs SET category_order = 5 WHERE category = 'Property Features';
UPDATE airbnb_field_configs SET category_order = 6 WHERE category = 'Service Type';
UPDATE airbnb_field_configs SET category_order = 7 WHERE category = 'Cleaning History';
UPDATE airbnb_field_configs SET category_order = 8 WHERE category = 'Oven Cleaning';
-- Place Cleaning Products and Equipment before Linen/Ironing
UPDATE airbnb_field_configs SET category_order = 9 WHERE category = 'Cleaning Products';
UPDATE airbnb_field_configs SET category_order = 10 WHERE category = 'Equipment';
UPDATE airbnb_field_configs SET category_order = 11 WHERE category = 'Equipment Arrangement';
UPDATE airbnb_field_configs SET category_order = 12 WHERE category = 'Linen Handling';
UPDATE airbnb_field_configs SET category_order = 13 WHERE category = 'Ironing';
UPDATE airbnb_field_configs SET category_order = 14 WHERE category = 'Time Flexibility';