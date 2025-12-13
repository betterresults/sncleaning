-- Create SMS template for bank transfer payment details
INSERT INTO sms_templates (
  id,
  name, 
  description, 
  content, 
  is_active, 
  variables
) VALUES (
  gen_random_uuid(),
  'Bank Transfer Details',
  'SMS with bank account details for bank transfer payment',
  'Hi {{customer_name}}, thank you for booking with SN Cleaning Services. To secure your booking for {{booking_date}}, please transfer £{{amount}} at least 48 hours before your appointment. Bank Details: Sort Code: 20-00-00, Account: 12345678, Ref: SN{{booking_id}}. Thank you!',
  true,
  '["customer_name", "booking_date", "amount", "booking_id"]'::jsonb
);