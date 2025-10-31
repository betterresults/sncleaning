-- Add short notice charge configurations to Time Flexibility category
INSERT INTO airbnb_field_configs (
  category, 
  option, 
  label, 
  value, 
  value_type, 
  time, 
  icon,
  is_visible, 
  display_order, 
  category_order,
  is_active
) VALUES 
  (
    'Time Flexibility', 
    'under_48h', 
    'Under 48 hours - Extra charge (£)', 
    15, 
    'fixed', 
    0,
    '⚡',
    true, 
    3, 
    14,
    true
  ),
  (
    'Time Flexibility', 
    'under_24h', 
    'Under 24 hours - Extra charge (£)', 
    30, 
    'fixed', 
    0,
    '⚡⚡',
    true, 
    4, 
    14,
    true
  ),
  (
    'Time Flexibility', 
    'under_12h', 
    'Same day (under 12h) - Extra charge (£)', 
    50, 
    'fixed', 
    0,
    '🔥',
    true, 
    5, 
    14,
    true
  )
ON CONFLICT (id) DO NOTHING;