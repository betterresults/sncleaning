-- Reset was_created_until to allow generating current bookings
UPDATE recurring_services 
SET was_created_until = NULL 
WHERE was_created_until > CURRENT_DATE;

-- Run the recurring bookings generation function
SELECT generate_recurring_bookings();