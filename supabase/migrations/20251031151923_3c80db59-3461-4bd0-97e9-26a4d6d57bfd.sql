-- Delete the incorrect categories completely
DELETE FROM airbnb_field_configs 
WHERE category IN ('Cleaning Products', 'Equipment', 'Equipment Arrangement');

-- Add correct "Cleaning Supplies" options to match form
INSERT INTO airbnb_field_configs (category, option, value, value_type, time, icon, label, is_visible, display_order, category_order)
VALUES 
  ('Cleaning Supplies', 'no', 0, 'none', 0, '❌', 'No', true, 1, 70),
  ('Cleaning Supplies', 'productsOnly', 0, 'none', 0, '🧴', 'Products Only', true, 2, 70),
  ('Cleaning Supplies', 'productsAndEquipment', 0, 'none', 0, '🧹', 'Products and Equipment', true, 3, 70);

-- Add correct "Equipment Arrangement" options to match form
INSERT INTO airbnb_field_configs (category, option, value, value_type, time, icon, label, is_visible, display_order, category_order)
VALUES 
  ('Equipment Arrangement', 'ongoing', 0, 'none', 0, '🔄', 'Ongoing', true, 1, 80),
  ('Equipment Arrangement', 'oneTime', 0, 'none', 0, '1️⃣', 'One-time', true, 2, 80);