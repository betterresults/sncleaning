-- Update bookings table to round all price fields to 2 decimal places
UPDATE bookings 
SET 
  total_cost = ROUND(total_cost::numeric, 2),
  cleaner_pay = ROUND(cleaner_pay::numeric, 2),
  cleaning_cost_per_hour = ROUND(cleaning_cost_per_hour::numeric, 2)
WHERE total_cost IS NOT NULL 
   OR cleaner_pay IS NOT NULL 
   OR cleaning_cost_per_hour IS NOT NULL;