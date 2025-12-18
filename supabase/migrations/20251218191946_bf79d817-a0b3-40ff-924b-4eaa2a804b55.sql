-- Update Weekly and Biweekly pricing to £23/hour
UPDATE airbnb_field_configs 
SET value = 23, updated_at = now() 
WHERE category ILIKE '%domestic%frequency%' AND option IN ('weekly', 'biweekly');

-- Update Biweekly label to "Bi-Weekly"
UPDATE airbnb_field_configs 
SET label = 'Bi-Weekly', updated_at = now() 
WHERE category ILIKE '%domestic%frequency%' AND option = 'biweekly';