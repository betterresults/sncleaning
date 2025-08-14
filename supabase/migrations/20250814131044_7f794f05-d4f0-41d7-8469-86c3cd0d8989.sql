-- Fix permissions for the recurring bookings function
CREATE OR REPLACE FUNCTION public.generate_recurring_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to run with elevated privileges
SET search_path TO 'public'
AS $function$
DECLARE
    rs RECORD;
    booking_date date;
    booking_datetime timestamptz;
    day_name text;
    addr RECORD;
    latest_inserted_date date;
    loop_counter integer;
    max_iterations integer := 50; 
    bookings_created integer := 0;
BEGIN
    -- Log start of function
    RAISE NOTICE 'Starting generate_recurring_bookings function at %', NOW();
    
    FOR rs IN 
        SELECT * 
        FROM public.recurring_services
        WHERE postponed IS DISTINCT FROM TRUE
        AND start_date IS NOT NULL
        AND interval IS NOT NULL
        AND days_of_the_week IS NOT NULL
        AND recurring_group_id IS NOT NULL
        LIMIT 5 
    LOOP
        RAISE NOTICE 'Processing recurring service ID: % for %', rs.id, rs.days_of_the_week;
        
        -- Reset variables
        loop_counter := 0;
        latest_inserted_date := NULL;
        
        -- Start from current date or continue from last generated
        booking_date := COALESCE(rs.was_created_until + (rs.interval || ' days')::interval, rs.start_date, CURRENT_DATE);
        
        -- Ensure we don't start in the past
        IF booking_date < CURRENT_DATE THEN
            booking_date := CURRENT_DATE;
        END IF;

        -- Generate bookings for next 30 days
        WHILE booking_date <= CURRENT_DATE + INTERVAL '30 days' AND loop_counter < max_iterations LOOP
            loop_counter := loop_counter + 1;
            
            -- Check if this is the correct day of the week
            day_name := LOWER(TRIM(to_char(booking_date, 'Day')));
            
            IF day_name = LOWER(TRIM(rs.days_of_the_week)) THEN
                -- Check if booking already exists
                IF NOT EXISTS (
                    SELECT 1 FROM public.bookings 
                    WHERE customer = rs.customer 
                    AND date_time::date = booking_date
                    AND recurring_group_id = rs.recurring_group_id
                ) THEN
                    
                    booking_datetime := booking_date + rs.start_time;

                    -- Get address details
                    SELECT address, postcode INTO addr
                    FROM public.addresses 
                    WHERE id = rs.address;
                    
                    IF addr.address IS NOT NULL THEN
                        -- Create the booking
                        INSERT INTO public.bookings (
                            customer, cleaning_type, date_time, address, postcode,
                            cleaner, hours_required, cleaning_cost_per_hour, total_cost,
                            cleaner_rate, cleaner_pay, payment_method, booking_status,
                            recurring_group_id, date_only
                        )
                        VALUES (
                            rs.customer, rs.cleaning_type, booking_datetime, addr.address, addr.postcode,
                            rs.cleaner, rs.hours::numeric, rs.cost_per_hour, rs.total_cost,
                            rs.cleaner_rate, (rs.total_cost * rs.cleaner_rate / 100), rs.payment_method, 'active',
                            rs.recurring_group_id, booking_date
                        );

                        bookings_created := bookings_created + 1;
                        latest_inserted_date := booking_date;
                        
                        RAISE NOTICE 'CREATED booking for % (Service %)', booking_date, rs.id;
                    END IF;
                END IF;
            END IF;

            booking_date := booking_date + INTERVAL '1 day';
        END LOOP;

        -- Update the last generated date
        IF latest_inserted_date IS NOT NULL THEN
            UPDATE public.recurring_services
            SET was_created_until = latest_inserted_date
            WHERE id = rs.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Function completed. Created % bookings total', bookings_created;
END;
$function$;