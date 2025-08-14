-- Test function to debug recurring bookings generation
CREATE OR REPLACE FUNCTION public.test_generate_recurring_bookings()
RETURNS TABLE(
  service_id bigint,
  start_date date,
  calculated_start date,
  day_check text,
  days_of_week text,
  booking_date date,
  day_name text,
  address_found boolean,
  created boolean,
  error_msg text
)
LANGUAGE plpgsql
AS $function$
DECLARE
    rs RECORD;
    test_booking_date date;
    test_booking_datetime timestamptz;
    test_day_name text;
    addr RECORD;
    test_created boolean;
    test_error text;
BEGIN
    FOR rs IN 
        SELECT * 
        FROM public.recurring_services
        WHERE postponed IS DISTINCT FROM TRUE
        LIMIT 5
    LOOP
        -- Reset variables
        test_created := false;
        test_error := '';
        
        -- Calculate start date
        test_booking_date := COALESCE(rs.was_created_until + (rs.interval || ' days')::interval, rs.start_date, CURRENT_DATE);
        
        -- Ensure we don't start in the past
        IF test_booking_date < CURRENT_DATE THEN
            test_booking_date := CURRENT_DATE;
        END IF;
        
        -- Get address
        SELECT address, postcode INTO addr
        FROM public.addresses 
        WHERE id = rs.address;
        
        -- Check only next few dates
        FOR i IN 0..14 LOOP -- Check next 14 days
            test_day_name := LOWER(TRIM(to_char(test_booking_date, 'Day')));
            
            -- Return debug info for each date checked
            RETURN QUERY SELECT 
                rs.id::bigint,
                rs.start_date,
                test_booking_date,
                (test_day_name || ' vs ' || LOWER(TRIM(rs.days_of_the_week)))::text,
                rs.days_of_the_week,
                test_booking_date,
                test_day_name,
                (addr.address IS NOT NULL),
                (test_day_name = LOWER(TRIM(rs.days_of_the_week))),
                test_error;
            
            test_booking_date := test_booking_date + INTERVAL '1 day';
        END LOOP;
        
    END LOOP;
END;
$function$;