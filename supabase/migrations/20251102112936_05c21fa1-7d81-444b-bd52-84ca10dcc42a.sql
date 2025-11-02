-- Add Same Day field configuration for Airbnb form
-- This field asks if guests check out and check in on the same day

INSERT INTO airbnb_field_configs (
  category,
  option,
  label,
  value,
  time,
  value_type,
  icon,
  is_visible,
  is_active,
  display_order,
  category_order
) VALUES
  ('sameDay', 'no', 'Не', 1, 0, 'fixed', '⏰', true, true, 1, 8),
  ('sameDay', 'yes', 'Да (бързо)', 1.3, 30, 'fixed', '🏃', true, true, 2, 8)
ON CONFLICT DO NOTHING;