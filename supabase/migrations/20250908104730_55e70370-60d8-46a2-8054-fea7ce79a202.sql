-- Fix duplicate customers by merging data and updating the auto-create function
-- First, let's update bookings to use the older customer record (ID: 14) and then delete the duplicate (ID: 18)

-- Update any bookings that reference the duplicate customer
UPDATE public.bookings 
SET customer = 14 
WHERE customer = 18;

-- Update any addresses that reference the duplicate customer  
UPDATE public.addresses 
SET customer_id = 14 
WHERE customer_id = 18;

-- Update any payment methods that reference the duplicate customer
UPDATE public.customer_payment_methods 
SET customer_id = 14 
WHERE customer_id = 18;

-- Update any profiles that reference the duplicate customer
UPDATE public.profiles 
SET customer_id = 14 
WHERE customer_id = 18;

-- Update any linen inventory that references the duplicate customer
UPDATE public.linen_inventory 
SET customer_id = 14 
WHERE customer_id = 18;

-- Update any linen orders that reference the duplicate customer
UPDATE public.linen_orders 
SET customer_id = 14 
WHERE customer_id = 18;

-- Update any chats that reference the duplicate customer
UPDATE public.chats 
SET customer_id = 14 
WHERE customer_id = 18;

-- Update any recurring services that reference the duplicate customer
UPDATE public.recurring_services 
SET customer = 14 
WHERE customer = 18;

-- Now update the customer information to use the most recent data
UPDATE public.customers 
SET first_name = 'Endaa',
    last_name = 'Endaa', 
    email = 'contact@to-cs.co.uk',
    clent_type = 'business',
    client_status = 'Current'
WHERE id = 14;

-- Delete the duplicate customer
DELETE FROM public.customers WHERE id = 18;