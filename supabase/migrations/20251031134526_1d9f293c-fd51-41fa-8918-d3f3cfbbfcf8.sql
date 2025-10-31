-- Deactivate all existing Ironing category entries
UPDATE airbnb_field_configs 
SET is_active = false 
WHERE category = 'Ironing';

-- Insert the two exact ironing options from the form
INSERT INTO airbnb_field_configs (
  category, 
  option, 
  label, 
  value, 
  value_type, 
  time, 
  is_visible, 
  display_order, 
  category_order,
  is_active
) VALUES 
  (
    'Ironing', 
    'yes_iron_linens', 
    'Yes, iron linens', 
    0, 
    'none', 
    90,  -- 1.5 hours = 90 minutes as per form logic
    true, 
    1, 
    13,  -- Keep same category order
    true
  ),
  (
    'Ironing', 
    'no_ironing_needed', 
    'No ironing needed', 
    0, 
    'none', 
    0, 
    true, 
    2, 
    13,
    true
  )
ON CONFLICT (id) DO NOTHING;