-- Fix the create_default_customer_address function to use correct column name
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

    -- Insert a new address using booking details or customer details
    INSERT INTO public.addresses (
        customer_id,
        address,
        postcode,
        access,
        is_default
    ) VALUES (
        NEW.id,
        COALESCE(v_booking_address, 'Unknown Address'),
        COALESCE(v_booking_postcode, 'Unknown Postcode'),
        COALESCE(v_access, 'Not Specified'),
        true  -- Set as default address
    );

    RETURN NEW;
END;$function$;