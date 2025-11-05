-- Update existing 'Invoiceless' payment methods to 'Invoiless' in past_bookings
UPDATE past_bookings 
SET payment_method = 'Invoiless' 
WHERE payment_method = 'Invoiceless';

-- Update existing 'Invoiceless' payment methods to 'Invoiless' in bookings
UPDATE bookings 
SET payment_method = 'Invoiless' 
WHERE payment_method = 'Invoiceless';

-- Update existing 'Invoiceless' payment methods to 'Invoiless' in recurring_services
UPDATE recurring_services 
SET payment_method = 'Invoiless' 
WHERE payment_method = 'Invoiceless';