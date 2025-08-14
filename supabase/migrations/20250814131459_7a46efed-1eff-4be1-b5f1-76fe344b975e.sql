-- Check existing triggers on bookings table
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'bookings';

-- Create trigger to populate customer info in bookings from customer table
CREATE OR REPLACE FUNCTION populate_booking_customer_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    customer_rec RECORD;
BEGIN
    -- Get customer details
    SELECT first_name, last_name, email, phone INTO customer_rec
    FROM public.customers
    WHERE id = NEW.customer;
    
    -- Only update if booking fields are empty and customer has data
    IF customer_rec.first_name IS NOT NULL AND (NEW.first_name IS NULL OR NEW.first_name = '') THEN
        NEW.first_name := customer_rec.first_name;
    END IF;
    
    IF customer_rec.last_name IS NOT NULL AND (NEW.last_name IS NULL OR NEW.last_name = '') THEN
        NEW.last_name := customer_rec.last_name;
    END IF;
    
    IF customer_rec.email IS NOT NULL AND (NEW.email IS NULL OR NEW.email = '') THEN
        NEW.email := customer_rec.email;
    END IF;
    
    IF customer_rec.phone IS NOT NULL AND (NEW.phone_number IS NULL OR NEW.phone_number = '') THEN
        NEW.phone_number := customer_rec.phone;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS populate_customer_info_trigger ON public.bookings;
CREATE TRIGGER populate_customer_info_trigger
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION populate_booking_customer_info();

-- Update existing recurring bookings with customer information
UPDATE public.bookings b
SET 
    first_name = c.first_name,
    last_name = c.last_name,
    email = c.email,
    phone_number = c.phone
FROM public.customers c
WHERE b.customer = c.id 
AND b.recurring_group_id IS NOT NULL
AND c.first_name IS NOT NULL;