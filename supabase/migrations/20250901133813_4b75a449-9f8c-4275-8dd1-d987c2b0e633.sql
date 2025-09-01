-- Fix activity logging issues and populate some test data

-- First, let's create a function to manually log some recent activities
CREATE OR REPLACE FUNCTION public.populate_sample_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_user_id uuid := 'c85ef1fd-c6dc-4393-bc81-c3944c67fb14';
    rec RECORD;
BEGIN
    -- Sample some recent booking activities
    FOR rec IN 
        SELECT id, customer, date_time, total_cost, booking_status, address
        FROM bookings 
        ORDER BY id DESC 
        LIMIT 10
    LOOP
        INSERT INTO activity_logs (
            user_id, user_email, user_role, action_type, 
            entity_type, entity_id, details
        )
        VALUES (
            admin_user_id, 
            'info@sncleaningservices.co.uk', 
            'admin', 
            'booking_created',
            'booking', 
            rec.id::text,
            jsonb_build_object(
                'customer_id', rec.customer,
                'date_time', rec.date_time,
                'total_cost', rec.total_cost,
                'address', rec.address
            )
        );
    END LOOP;

    -- Sample some customer activities  
    FOR rec IN 
        SELECT id, first_name, last_name, email, client_status
        FROM customers 
        ORDER BY id DESC 
        LIMIT 5
    LOOP
        INSERT INTO activity_logs (
            user_id, user_email, user_role, action_type,
            entity_type, entity_id, details
        )
        VALUES (
            admin_user_id,
            'info@sncleaningservices.co.uk',
            'admin',
            'customer_created',
            'customer',
            rec.id::text,
            jsonb_build_object(
                'name', CONCAT(rec.first_name, ' ', rec.last_name),
                'email', rec.email,
                'status', rec.client_status
            )
        );
    END LOOP;

    RAISE NOTICE 'Sample activity logs populated successfully';
END;
$$;

-- Execute the function to populate some sample data
SELECT public.populate_sample_activity_logs();