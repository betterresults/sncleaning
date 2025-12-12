-- Update weekly rate from 23 to 24 for Domestic Service Frequency
UPDATE airbnb_field_configs 
SET value = 24, updated_at = now()
WHERE category = 'Domestic Service Frequency' 
AND option = 'weekly';