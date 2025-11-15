CREATE OR REPLACE FUNCTION public.generate_recurring_bookings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    existing_booking_id bigint;
    services_resumed integer := 0;
    booking_created_this_iteration boolean;
    days_array text[];
    current_day text;
BEGIN
    RAISE NOTICE 'Starting generate_recurring_bookings function at %', NOW();
    
    -- First, check for services that should be automatically resumed
    UPDATE public.recurring_services 
    SET postponed = false, resume_date = null 
    WHERE postponed = true 
      AND resume_date IS NOT NULL 
      AND resume_date <= CURRENT_DATE;
    
    GET DIAGNOSTICS services_resumed = ROW_COUNT;
    IF services_resumed > 0 THEN
        RAISE NOTICE 'Automatically resumed % postponed services', services_resumed;
    END IF;
    
    -- Now process services that are not postponed
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
        RAISE NOTICE 'Processing recurring service ID: % for % with interval % days', rs.id, rs.days_of_the_week, rs.interval;
        
        -- Split days_of_the_week by comma to handle multiple days
        days_array := string_to_array(LOWER(TRIM(rs.days_of_the_week)), ',');
        
        -- Trim each day in the array
        FOR i IN 1..array_length(days_array, 1) LOOP
            days_array[i] := TRIM(days_array[i]);
        END LOOP;
        
        loop_counter := 0;
        latest_inserted_date := NULL;
        
        SELECT id INTO existing_booking_id
        FROM public.bookings 
        WHERE customer = rs.customer 
        AND date_time::date = rs.start_date
        AND (recurring_group_id IS NULL OR recurring_group_id != rs.recurring_group_id);
        
        IF existing_booking_id IS NOT NULL THEN
            UPDATE public.bookings 
            SET recurring_group_id = rs.recurring_group_id
            WHERE id = existing_booking_id;
            RAISE NOTICE 'Updated existing booking % with recurring_group_id %', existing_booking_id, rs.recurring_group_id;
        END IF;
        
        booking_date := COALESCE(rs.was_created_until + (rs.interval || ' days')::interval, rs.start_date, CURRENT_DATE);
        
        IF booking_date < CURRENT_DATE THEN
            booking_date := CURRENT_DATE;
        END IF;

        WHILE booking_date <= CURRENT_DATE + INTERVAL '30 days' AND loop_counter < max_iterations LOOP
            loop_counter := loop_counter + 1;
            booking_created_this_iteration := false;
            
            day_name := LOWER(TRIM(to_char(booking_date, 'Day')));
            
            -- Check if current day matches ANY of the configured days
            IF day_name = ANY(days_array) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.bookings 
                    WHERE customer = rs.customer 
                    AND date_time::date = booking_date
                    AND recurring_group_id = rs.recurring_group_id
                ) THEN
                    
                    booking_datetime := booking_date + rs.start_time;

                    SELECT address, postcode INTO addr
                    FROM public.addresses 
                    WHERE id = rs.address;
                    
                    IF addr.address IS NOT NULL THEN
                        INSERT INTO public.bookings (
                            customer, cleaning_type, date_time, address, postcode,
                            cleaner, hours_required, total_hours, cleaning_cost_per_hour, total_cost,
                            cleaner_rate, cleaner_pay, payment_method, booking_status,
                            recurring_group_id, date_only, time_only, send_notification_email
                        )
                        VALUES (
                            rs.customer, rs.cleaning_type, booking_datetime, addr.address, addr.postcode,
                            rs.cleaner, rs.hours::numeric, rs.hours::numeric, rs.cost_per_hour, rs.total_cost,
                            rs.cleaner_rate, (rs.total_cost * rs.cleaner_rate / 100), rs.payment_method, 'active',
                            rs.recurring_group_id, booking_date, rs.start_time::time, false
                        );

                        bookings_created := bookings_created + 1;
                        latest_inserted_date := booking_date;
                        booking_created_this_iteration := true;
                        
                        RAISE NOTICE 'CREATED booking for % (Service % - Day: %)', booking_date, rs.id, day_name;
                    END IF;
                ELSE
                    RAISE NOTICE 'SKIPPED booking for % - already exists (Service %)', booking_date, rs.id;
                END IF;
            END IF;

            -- Move to next day
            booking_date := booking_date + INTERVAL '1 day';
        END LOOP;

        IF latest_inserted_date IS NOT NULL THEN
            UPDATE public.recurring_services
            SET was_created_until = latest_inserted_date
            WHERE id = rs.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Function completed. Resumed % services, Created % bookings total', services_resumed, bookings_created;
END;
$function$;