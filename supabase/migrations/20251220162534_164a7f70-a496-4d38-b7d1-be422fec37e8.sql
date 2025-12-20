UPDATE airbnb_field_configs 
SET value = 24, updated_at = now()
WHERE category = 'Domestic Service Frequency' AND option = 'biweekly' AND is_active = true;