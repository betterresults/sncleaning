-- Update the create_default_customer_address function to not create addresses with "Unknown" values
CREATE OR REPLACE FUNCTION public.create_default_customer_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$DECLARE
    v_booking_address text;
    v_booking_postcode text;
    v_access text;
BEGIN
    -- Find booking details for the new customer (use 'customer' not 'customer_id')
    SELECT 
        b.address, 
        b.postcode,
        b.access
    INTO 
        v_booking_address, 
        v_booking_postcode,
        v_access
    FROM 
        public.bookings b
    WHERE 
        b.customer = NEW.id
    LIMIT 1;

    -- Only insert an address if we have valid address data from bookings
    IF v_booking_address IS NOT NULL AND v_booking_address != '' AND 
       v_booking_postcode IS NOT NULL AND v_booking_postcode != '' THEN
        INSERT INTO public.addresses (
            customer_id,
            address,
            postcode,
            access,
            is_default
        ) VALUES (
            NEW.id,
            v_booking_address,
            v_booking_postcode,
            COALESCE(v_access, 'Not Specified'),
            true  -- Set as default address
        );
    END IF;

    RETURN NEW;
END;$function$;