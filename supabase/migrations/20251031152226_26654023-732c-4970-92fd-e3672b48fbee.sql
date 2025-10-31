-- Align Cleaning Supplies with the form (No, Products, Equipment)
DELETE FROM airbnb_field_configs WHERE category = 'Cleaning Supplies';
INSERT INTO airbnb_field_configs (category, option, value, value_type, time, icon, label, is_visible, display_order, category_order)
VALUES
  ('Cleaning Supplies','no',0,'none',0,'X','No',true,1,70),
  ('Cleaning Supplies','products',0,'none',0,'Droplets','Products',true,2,70),
  ('Cleaning Supplies','equipment',0,'none',0,'Wrench','Equipment',true,3,70);

-- Standardize Equipment Arrangement option naming to match UI
UPDATE airbnb_field_configs 
SET option = 'oneoff', label = 'One-time'
WHERE category = 'Equipment Arrangement' AND option IN ('oneTime','one-time');