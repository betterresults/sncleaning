-- Migrate existing customer addresses to addresses table
INSERT INTO public.addresses (customer_id, address, postcode, is_default)
SELECT 
    id as customer_id,
    address,
    postcode,
    true as is_default
FROM public.customers 
WHERE address IS NOT NULL 
    AND address != '' 
    AND postcode IS NOT NULL 
    AND postcode != '';