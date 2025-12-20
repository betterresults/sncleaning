-- Set cleaning products (supplies) charge to zero
UPDATE airbnb_field_configs 
SET value = 0, updated_at = now()
WHERE category = 'Cleaning Supplies' AND option = 'products';