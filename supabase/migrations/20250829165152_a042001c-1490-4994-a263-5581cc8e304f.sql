-- Remove "wash and iron" text from all linen product names and types
UPDATE linen_products 
SET name = TRIM(REGEXP_REPLACE(name, '\s*\(wash\s*&?\s*iron\)', '', 'gi')),
    type = TRIM(REGEXP_REPLACE(type, '\s*\(wash\s*&?\s*iron\)', '', 'gi'))
WHERE name ILIKE '%wash%' OR name ILIKE '%iron%' OR type ILIKE '%wash%' OR type ILIKE '%iron%';

-- Clean up any extra spaces that might be left
UPDATE linen_products 
SET name = REGEXP_REPLACE(name, '\s+', ' ', 'g'),
    type = REGEXP_REPLACE(type, '\s+', ' ', 'g')
WHERE name ~ '\s{2,}' OR type ~ '\s{2,}';