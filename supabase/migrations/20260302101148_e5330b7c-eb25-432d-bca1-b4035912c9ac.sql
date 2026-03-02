-- Round all existing total_cost values in bookings to 2 decimal places
UPDATE bookings SET total_cost = ROUND(total_cost::numeric, 2) WHERE total_cost IS NOT NULL;

-- Round cleaner_pay in bookings
UPDATE bookings SET cleaner_pay = ROUND(cleaner_pay::numeric, 2) WHERE cleaner_pay IS NOT NULL;

-- Round cleaning_cost_per_hour in bookings
UPDATE bookings SET cleaning_cost_per_hour = ROUND(cleaning_cost_per_hour::numeric, 2) WHERE cleaning_cost_per_hour IS NOT NULL;

-- For past_bookings, total_cost is text - update only numeric values
UPDATE past_bookings SET total_cost = ROUND(total_cost::numeric, 2)::text 
WHERE total_cost IS NOT NULL 
AND total_cost ~ '^\d+\.?\d*$';