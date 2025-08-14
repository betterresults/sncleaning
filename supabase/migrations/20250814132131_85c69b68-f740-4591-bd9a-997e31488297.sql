-- Fix the update_customer_id trigger to prevent creating new customers when customer ID is already set
CREATE OR REPLACE FUNCTION public.update_customer_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    customer_id bigint;
BEGIN
    -- Only run this logic if customer is NULL or empty AND we have email data
    -- This prevents overriding existing customer IDs from recurring bookings
    IF (NEW.customer IS NULL OR NEW.customer = 0) AND NEW.email IS NOT NULL AND NEW.email != '' THEN
        SELECT id INTO customer_id
        FROM public.customers
        WHERE email = NEW.email;

        IF customer_id IS NOT NULL THEN
            UPDATE public.customers
            SET client_status = 'Current'
            WHERE id = customer_id;
        ELSE
            -- Insert customer without address/postcode fields (they don't exist in customers table)
            INSERT INTO public.customers (first_name, last_name, phone, email, client_status)
            VALUES (
                NEW.first_name, NEW.last_name, NEW.phone_number, NEW.email, 'New'
            )
            RETURNING id INTO customer_id;
        END IF;

        NEW.customer := customer_id;
    END IF;
    
    RETURN NEW;
END;
$function$;