-- Update cleaning_photos table to reference the correct customer
UPDATE public.cleaning_photos 
SET customer_id = 14 
WHERE customer_id = 18;

-- Now delete the duplicate customer
DELETE FROM public.customers WHERE id = 18;