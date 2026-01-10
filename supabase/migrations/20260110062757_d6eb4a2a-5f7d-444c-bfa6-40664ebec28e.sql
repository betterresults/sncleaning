-- Fix incorrect intervals for biweekly services (should be 14, not 7)
UPDATE recurring_services 
SET interval = '14'
WHERE (frequently = 'biweekly' OR frequently = 'bi-weekly') 
  AND interval = '7';

-- Standardize frequency names: convert 'biweekly' to 'bi-weekly' for consistency
UPDATE recurring_services 
SET frequently = 'bi-weekly'
WHERE frequently = 'biweekly';