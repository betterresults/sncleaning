-- Update the "Get Payment Details" trigger to only send to card payment customers
UPDATE notification_triggers 
SET conditions = '["no_payment_method", "payment_method_card"]'::jsonb
WHERE id = '8123075f-56f9-412f-af3e-139166a4f52d';

-- Also update the Payment Reminder 48h trigger to only apply to card payments
UPDATE notification_triggers 
SET conditions = '["no_payment_method", "payment_method_card"]'::jsonb
WHERE id = 'de9646b6-93f5-490a-bddb-cac105a4e86e';