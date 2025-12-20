UPDATE airbnb_field_configs 
SET value = 24, updated_at = now()
WHERE category = 'Service Frequency' AND option = 'Bi-Weekly' AND is_active = true;