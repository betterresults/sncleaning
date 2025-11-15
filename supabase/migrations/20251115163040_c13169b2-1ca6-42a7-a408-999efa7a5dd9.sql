-- Update existing recurring bookings to set time_only from date_time
UPDATE public.bookings 
SET time_only = date_time::time
WHERE recurring_group_id IS NOT NULL 
  AND time_only IS NULL 
  AND date_time IS NOT NULL;