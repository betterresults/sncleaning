
-- Update service types to include allowed_cleaning_types
UPDATE company_settings 
SET setting_value = setting_value || '{"allowed_cleaning_types": ["standard_cleaning", "deep_cleaning"]}'::jsonb
WHERE setting_category = 'service_type' AND setting_key = 'airbnb';

UPDATE company_settings 
SET setting_value = setting_value || '{"allowed_cleaning_types": ["standard_cleaning", "deep_cleaning", "one_off"]}'::jsonb
WHERE setting_category = 'service_type' AND setting_key = 'domestic';

UPDATE company_settings 
SET setting_value = setting_value || '{"allowed_cleaning_types": ["standard_cleaning", "deep_cleaning"]}'::jsonb
WHERE setting_category = 'service_type' AND setting_key = 'commercial';

UPDATE company_settings 
SET setting_value = setting_value || '{"allowed_cleaning_types": ["deep_cleaning", "move_in_out"]}'::jsonb
WHERE setting_category = 'service_type' AND setting_key = 'end_of_tenancy';

UPDATE company_settings 
SET setting_value = setting_value || '{"allowed_cleaning_types": ["deep_cleaning"]}'::jsonb
WHERE setting_category = 'service_type' AND setting_key = 'deep_cleaning';
