-- Add is_default column to airbnb_field_configs
ALTER TABLE airbnb_field_configs 
ADD COLUMN is_default boolean DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN airbnb_field_configs.is_default IS 'When true, this option is used as the default value when the field is not filled by the user';

-- Create index for faster default lookups
CREATE INDEX idx_airbnb_field_configs_default 
ON airbnb_field_configs(category, is_default) 
WHERE is_default = true AND is_active = true;

-- Add constraint to ensure only one default per category
CREATE UNIQUE INDEX idx_one_default_per_category 
ON airbnb_field_configs(category) 
WHERE is_default = true AND is_active = true;