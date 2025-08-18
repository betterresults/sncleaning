-- Remove addresses with "Unknown" values that were created by the old trigger
DELETE FROM public.addresses 
WHERE address = 'Unknown Address' AND postcode = 'Unknown Postcode';