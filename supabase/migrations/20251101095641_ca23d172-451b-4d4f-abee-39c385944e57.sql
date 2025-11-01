-- Step 1: Add recommended_hours column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS recommended_hours numeric;

-- Step 2: Add recommended_hours column to past_bookings table
ALTER TABLE public.past_bookings 
ADD COLUMN IF NOT EXISTS recommended_hours numeric;

-- Step 3: Copy data from hours_required to recommended_hours in bookings
UPDATE public.bookings 
SET recommended_hours = hours_required 
WHERE recommended_hours IS NULL AND hours_required IS NOT NULL;

-- Step 4: Copy data from hours_required to recommended_hours in past_bookings
UPDATE public.past_bookings 
SET recommended_hours = hours_required 
WHERE recommended_hours IS NULL AND hours_required IS NOT NULL;

-- Step 5: Create function to fix missing total_hours by copying from hours_required
CREATE OR REPLACE FUNCTION fix_missing_total_hours()
RETURNS TABLE(bookings_updated INTEGER, past_bookings_updated INTEGER) AS $$
DECLARE
  bookings_count INTEGER;
  past_bookings_count INTEGER;
BEGIN
  -- Fix bookings table
  UPDATE public.bookings 
  SET total_hours = hours_required 
  WHERE (total_hours IS NULL OR total_hours = 0) 
    AND hours_required IS NOT NULL 
    AND hours_required > 0;
  
  GET DIAGNOSTICS bookings_count = ROW_COUNT;
  
  -- Fix past_bookings table
  UPDATE public.past_bookings 
  SET total_hours = hours_required 
  WHERE (total_hours IS NULL OR total_hours = 0) 
    AND hours_required IS NOT NULL 
    AND hours_required > 0;
  
  GET DIAGNOSTICS past_bookings_count = ROW_COUNT;
  
  RETURN QUERY SELECT bookings_count, past_bookings_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Execute the fix function immediately
SELECT * FROM fix_missing_total_hours();

-- Step 7: Update generate_recurring_bookings function to use total_hours correctly
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
        RAISE NOTICE 'Processing recurring service ID: % for %', rs.id, rs.days_of_the_week;
        
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
            
            day_name := LOWER(TRIM(to_char(booking_date, 'Day')));
            
            IF day_name = LOWER(TRIM(rs.days_of_the_week)) THEN
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
                        -- IMPORTANT: Set total_hours = rs.hours (the actual billable hours)
                        INSERT INTO public.bookings (
                            customer, cleaning_type, date_time, address, postcode,
                            cleaner, hours_required, total_hours, cleaning_cost_per_hour, total_cost,
                            cleaner_rate, cleaner_pay, payment_method, booking_status,
                            recurring_group_id, date_only, send_notification_email
                        )
                        VALUES (
                            rs.customer, rs.cleaning_type, booking_datetime, addr.address, addr.postcode,
                            rs.cleaner, rs.hours::numeric, rs.hours::numeric, rs.cost_per_hour, rs.total_cost,
                            rs.cleaner_rate, (rs.total_cost * rs.cleaner_rate / 100), rs.payment_method, 'active',
                            rs.recurring_group_id, booking_date, false
                        );

                        bookings_created := bookings_created + 1;
                        latest_inserted_date := booking_date;
                        
                        RAISE NOTICE 'CREATED booking for % (Service %) - total_hours set to %', booking_date, rs.id, rs.hours;
                    END IF;
                ELSE
                    RAISE NOTICE 'SKIPPED booking for % - already exists (Service %)', booking_date, rs.id;
                END IF;
            END IF;

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