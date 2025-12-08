-- Update domestic service frequency hourly rates
UPDATE airbnb_field_configs 
SET value = 23, updated_at = now() 
WHERE category = 'Domestic Service Frequency' AND option = 'weekly';

UPDATE airbnb_field_configs 
SET value = 24, updated_at = now() 
WHERE category = 'Domestic Service Frequency' AND option = 'biweekly';

UPDATE airbnb_field_configs 
SET value = 24, updated_at = now() 
WHERE category = 'Domestic Service Frequency' AND option = 'monthly';

UPDATE airbnb_field_configs 
SET value = 25, updated_at = now() 
WHERE category = 'Domestic Service Frequency' AND option = 'onetime';