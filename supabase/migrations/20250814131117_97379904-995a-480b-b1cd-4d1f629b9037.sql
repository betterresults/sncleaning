-- Fix the update_customer_id function to work with current customers table schema
CREATE OR REPLACE FUNCTION public.update_customer_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    customer_id bigint;
BEGIN
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
    RETURN NEW;
END;
$function$;