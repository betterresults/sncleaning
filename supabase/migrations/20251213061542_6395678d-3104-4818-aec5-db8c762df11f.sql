-- Update the bank transfer SMS template with correct details
UPDATE public.sms_templates 
SET content = 'Hi {{customer_name}}, thank you for booking with SN Cleaning Services on {{booking_date}}. To secure your booking, please transfer £{{amount}} at least 48 hours before your appointment. Bank Details: SN CORE LTD, Sort Code: 04-29-09, Account: 85267368, Ref: SN{{booking_id}}. Thank you!',
    updated_at = now()
WHERE name = 'Bank Transfer Details';