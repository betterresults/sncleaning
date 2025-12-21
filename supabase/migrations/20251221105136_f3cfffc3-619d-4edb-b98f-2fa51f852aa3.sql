-- Add Bank Transfer payment method option
INSERT INTO company_settings (setting_category, setting_key, setting_value, display_order, is_active)
VALUES ('payment_method', 'bank_transfer', '{"label": "Bank Transfer"}', 0, true)
ON CONFLICT DO NOTHING;

-- Update display order to put Bank Transfer second (after Stripe)
UPDATE company_settings 
SET display_order = 0 
WHERE setting_category = 'payment_method' AND setting_key = 'stripe';

UPDATE company_settings 
SET display_order = 1 
WHERE setting_category = 'payment_method' AND setting_key = 'bank_transfer';