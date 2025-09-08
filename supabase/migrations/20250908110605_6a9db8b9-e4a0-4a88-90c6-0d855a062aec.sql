-- Now fix the duplicate customers by merging data
-- Update any references to the duplicate customer (ID: 18) to use the original (ID: 14)

UPDATE public.bookings 
SET customer = 14 
WHERE customer = 18;

UPDATE public.addresses 
SET customer_id = 14 
WHERE customer_id = 18;

UPDATE public.customer_payment_methods 
SET customer_id = 14 
WHERE customer_id = 18;

UPDATE public.profiles 
SET customer_id = 14 
WHERE customer_id = 18;

UPDATE public.linen_inventory 
SET customer_id = 14 
WHERE customer_id = 18;

UPDATE public.linen_orders 
SET customer_id = 14 
WHERE customer_id = 18;

UPDATE public.chats 
SET customer_id = 14 
WHERE customer_id = 18;

UPDATE public.recurring_services 
SET customer = 14 
WHERE customer = 18;

-- Update the customer information with the most recent data
UPDATE public.customers 
SET first_name = 'Endaa',
    last_name = 'Endaa', 
    email = 'contact@to-cs.co.uk',
    clent_type = 'business',
    client_status = 'Current'
WHERE id = 14;

-- Delete the duplicate customer
DELETE FROM public.customers WHERE id = 18;