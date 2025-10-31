-- Remove separate kitchen and living room entries, and extra features not in the form
DELETE FROM airbnb_field_configs 
WHERE category = 'Property Features' 
AND option IN ('separateKitchen', 'livingRoom', 'balconies', 'conservatory');

-- Add combined "Separate Kitchen & Living Room" entry
INSERT INTO airbnb_field_configs (
  category,
  option,
  label,
  value,
  value_type,
  time,
  icon,
  is_visible,
  is_active,
  display_order,
  category_order
) VALUES (
  'Property Features',
  'separateKitchenLivingRoom',
  'Separate Kitchen & Living Room',
  0,
  'none',
  20,
  'Home',
  true,
  true,
  1,
  5
) ON CONFLICT DO NOTHING;