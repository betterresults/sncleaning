-- Add config option for whether deep clean extra hours should be charged
-- Value: 1 = charge for extra hours, 0 = no charge (free deep clean extra hours)
INSERT INTO airbnb_field_configs (category, option, value, value_type, label, is_active, is_visible, display_order, category_order)
VALUES (
  'Deep Clean Settings',
  'charge_extra_hours',
  1,
  'fixed',
  'Charge for Extra Hours',
  true,
  true,
  1,
  25
);