-- Fix recurring_group_id for services that don't have one
UPDATE public.recurring_services 
SET recurring_group_id = gen_random_uuid() 
WHERE recurring_group_id IS NULL;

-- Updated function to ensure it works correctly
CREATE OR REPLACE FUNCTION public.generate_recurring_bookings()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    rs RECORD;
    booking_date date;
    booking_datetime timestamptz;
    day_name text;
    addr RECORD;
    latest_inserted_date date;
    loop_counter integer;
    max_iterations integer := 50; -- Reduced for safety
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
        LIMIT 5 -- Process max 5 services at a time
    LOOP
        RAISE NOTICE 'Processing recurring service ID: % for %', rs.id, rs.days_of_the_week;
        
        -- Reset loop counter for each service
        loop_counter := 0;
        latest_inserted_date := NULL;
        
        -- Start from current date or last generated date + interval
        booking_date := COALESCE(rs.was_created_until + (rs.interval || ' days')::interval, rs.start_date, CURRENT_DATE);
        
        -- Ensure we don't start in the past
        IF booking_date < CURRENT_DATE THEN
            booking_date := CURRENT_DATE;
        END IF;

        -- Cap generation at 30 days into the future and add safety counter
        WHILE booking_date <= CURRENT_DATE + INTERVAL '30 days' AND loop_counter < max_iterations LOOP
            loop_counter := loop_counter + 1;
            
            -- Match the specific day of the week (case insensitive)
            day_name := LOWER(TRIM(to_char(booking_date, 'Day')));
            
            RAISE NOTICE 'Checking date % (%) vs target day %', booking_date, day_name, LOWER(TRIM(rs.days_of_the_week));
            
            IF day_name = LOWER(TRIM(rs.days_of_the_week)) THEN
                -- Check if this booking already exists
                IF NOT EXISTS (
                    SELECT 1 FROM public.bookings 
                    WHERE customer = rs.customer 
                    AND date_time::date = booking_date
                    AND recurring_group_id = rs.recurring_group_id
                ) THEN
                    
                    booking_datetime := booking_date + rs.start_time;

                    -- Get address and postcode from addresses table
                    SELECT address, postcode INTO addr
                    FROM public.addresses 
                    WHERE id = rs.address;
                    
                    -- Only proceed if address exists
                    IF addr.address IS NOT NULL THEN
                        -- Insert booking
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
                        
                        RAISE NOTICE 'CREATED booking for date: % (Service ID: %)', booking_date, rs.id;
                    ELSE
                        RAISE NOTICE 'Address not found for service ID: %', rs.id;
                    END IF;
                ELSE
                    RAISE NOTICE 'Booking already exists for date: % (Service ID: %)', booking_date, rs.id;
                END IF;
            END IF;

            -- Move forward by 1 day to check next day
            booking_date := booking_date + INTERVAL '1 day';
        END LOOP;

        -- Update was_created_until if we inserted at least one booking
        IF latest_inserted_date IS NOT NULL THEN
            UPDATE public.recurring_services
            SET was_created_until = latest_inserted_date
            WHERE id = rs.id;
            
            RAISE NOTICE 'Updated was_created_until to % for service ID: %', latest_inserted_date, rs.id;
        END IF;
        
        -- Safety check for loop counter
        IF loop_counter >= max_iterations THEN
            RAISE NOTICE 'Hit max iterations limit for service ID: %', rs.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Function completed. Total bookings created: %', bookings_created;
END;
$function$;