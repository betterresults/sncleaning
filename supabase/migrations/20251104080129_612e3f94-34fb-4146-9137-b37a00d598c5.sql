-- Rename sub_service_type to cleaning_type in customer_pricing_overrides table
ALTER TABLE customer_pricing_overrides 
RENAME COLUMN sub_service_type TO cleaning_type;

-- Add comment for clarity
COMMENT ON COLUMN customer_pricing_overrides.cleaning_type IS 'Specific cleaning type within the service (e.g., checkin-checkout, midstay for airbnb-cleaning). NULL means override applies to entire service_type.';