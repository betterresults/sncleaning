-- Remove the additional_services category as it's already handled in Step 2 (EndOfTenancyExtrasStep)
UPDATE end_of_tenancy_field_configs 
SET is_active = false 
WHERE category = 'additional_services';