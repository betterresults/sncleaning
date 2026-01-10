-- Fix ALL type casting issues in generate_recurring_bookings function
CREATE OR REPLACE FUNCTION public.generate_recurring_bookings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  next_booking_date DATE;
  end_date DATE;
  day_of_week TEXT;
  target_dow INTEGER;
  booking_time TIME;
  booking_datetime TIMESTAMP WITH TIME ZONE;
  new_booking_id INTEGER;
  calculated_cleaner_pay NUMERIC;
  cleaner_hourly_rate NUMERIC;
  cleaner_percentage_rate NUMERIC;
  service_hours NUMERIC;
  address_text TEXT;
  address_postcode TEXT;
BEGIN
  -- First, check for services that should be resumed from postponement
  UPDATE public.recurring_services 
  SET postponed = false, resume_date = null 
  WHERE postponed = true 
    AND resume_date IS NOT NULL 
    AND resume_date <= CURRENT_DATE;

  -- Loop through all active recurring services
  FOR rec IN 
    SELECT rs.*, c.first_name, c.last_name, c.email, c.phone,
           cl.hourly_rate as cleaner_hourly_rate, cl.presentage_rate as cleaner_percentage_rate,
           a.address as full_address, a.postcode as address_postcode
    FROM public.recurring_services rs
    LEFT JOIN public.customers c ON rs.customer = c.id
    LEFT JOIN public.cleaners cl ON rs.cleaner = cl.id
    LEFT JOIN public.addresses a ON rs.address = a.id
    WHERE rs.confirmed = true
      AND (rs.postponed = false OR rs.postponed IS NULL)
      AND rs.start_date IS NOT NULL
      AND rs.start_time IS NOT NULL
  LOOP
    -- Store address info
    address_text := rec.full_address;
    address_postcode := rec.address_postcode;
    
    -- Calculate end date (30 days from now)
    end_date := CURRENT_DATE + INTERVAL '30 days';
    
    -- Get starting point for new bookings
    IF rec.was_created_until IS NOT NULL THEN
      next_booking_date := rec.was_created_until + INTERVAL '1 day';
    ELSE
      next_booking_date := GREATEST(rec.start_date::DATE, CURRENT_DATE);
    END IF;
    
    -- Skip if we've already generated bookings up to or past the end date
    IF next_booking_date > end_date THEN
      CONTINUE;
    END IF;
    
    -- Parse the time (convert TIME WITH TIME ZONE to TIME)
    BEGIN
      booking_time := rec.start_time::TIME;
    EXCEPTION WHEN OTHERS THEN
      booking_time := '09:00:00'::TIME;
    END;
    
    -- Parse hours as NUMERIC (hours column is TEXT)
    BEGIN
      service_hours := rec.hours::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
      service_hours := 3;
    END;
    
    -- Get cleaner rates (use custom rates from cleaner_recurring_rates if available)
    SELECT COALESCE(crr.custom_hourly_rate, rec.cleaner_hourly_rate),
           COALESCE(crr.custom_percentage_rate, rec.cleaner_percentage_rate)
    INTO cleaner_hourly_rate, cleaner_percentage_rate
    FROM (SELECT 1) dummy
    LEFT JOIN public.cleaner_recurring_rates crr 
      ON crr.recurring_group_id = rec.recurring_group_id 
      AND crr.cleaner_id = rec.cleaner;
    
    -- Calculate cleaner pay based on rate type
    IF rec.cleaner_rate IS NOT NULL THEN
      calculated_cleaner_pay := rec.cleaner_rate * service_hours;
    ELSIF cleaner_hourly_rate IS NOT NULL AND cleaner_hourly_rate > 0 THEN
      calculated_cleaner_pay := cleaner_hourly_rate * service_hours;
    ELSIF cleaner_percentage_rate IS NOT NULL AND cleaner_percentage_rate > 0 AND rec.total_cost IS NOT NULL THEN
      calculated_cleaner_pay := (rec.total_cost * cleaner_percentage_rate / 100);
    ELSE
      calculated_cleaner_pay := NULL;
    END IF;
    
    -- Handle different frequencies
    CASE rec.frequently
      WHEN 'weekly' THEN
        -- Get target day of week
        day_of_week := COALESCE(rec.days_of_the_week, 'Monday');
        target_dow := CASE day_of_week
          WHEN 'Sunday' THEN 0
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          ELSE 1
        END;
        
        -- Adjust to next occurrence of target day
        WHILE EXTRACT(DOW FROM next_booking_date) != target_dow AND next_booking_date <= end_date LOOP
          next_booking_date := next_booking_date + INTERVAL '1 day';
        END LOOP;
        
        -- Create weekly bookings
        WHILE next_booking_date <= end_date LOOP
          booking_datetime := next_booking_date + booking_time;
          
          -- Check if booking already exists (both are DATE type now)
          IF NOT EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE recurring_group_id = rec.recurring_group_id 
              AND date_only = next_booking_date
          ) THEN
            INSERT INTO public.bookings (
              customer, cleaner, address, postcode, date_time, date_only, time_only,
              total_hours, total_cost, cleaning_type, frequently, booking_status,
              first_name, last_name, email, phone_number, recurring_group_id,
              cleaner_pay, payment_method, created_by_source
            ) VALUES (
              rec.customer, rec.cleaner, address_text, address_postcode,
              booking_datetime, next_booking_date, booking_time,
              service_hours, rec.total_cost, rec.cleaning_type, rec.frequently,
              'upcoming', rec.first_name, rec.last_name, rec.email, rec.phone,
              rec.recurring_group_id, calculated_cleaner_pay, rec.payment_method,
              'recurring_auto'
            );
          END IF;
          
          next_booking_date := next_booking_date + INTERVAL '7 days';
        END LOOP;
        
      WHEN 'bi-weekly', 'fortnightly' THEN
        day_of_week := COALESCE(rec.days_of_the_week, 'Monday');
        target_dow := CASE day_of_week
          WHEN 'Sunday' THEN 0
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          ELSE 1
        END;
        
        WHILE EXTRACT(DOW FROM next_booking_date) != target_dow AND next_booking_date <= end_date LOOP
          next_booking_date := next_booking_date + INTERVAL '1 day';
        END LOOP;
        
        WHILE next_booking_date <= end_date LOOP
          booking_datetime := next_booking_date + booking_time;
          
          IF NOT EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE recurring_group_id = rec.recurring_group_id 
              AND date_only = next_booking_date
          ) THEN
            INSERT INTO public.bookings (
              customer, cleaner, address, postcode, date_time, date_only, time_only,
              total_hours, total_cost, cleaning_type, frequently, booking_status,
              first_name, last_name, email, phone_number, recurring_group_id,
              cleaner_pay, payment_method, created_by_source
            ) VALUES (
              rec.customer, rec.cleaner, address_text, address_postcode,
              booking_datetime, next_booking_date, booking_time,
              service_hours, rec.total_cost, rec.cleaning_type, rec.frequently,
              'upcoming', rec.first_name, rec.last_name, rec.email, rec.phone,
              rec.recurring_group_id, calculated_cleaner_pay, rec.payment_method,
              'recurring_auto'
            );
          END IF;
          
          next_booking_date := next_booking_date + INTERVAL '14 days';
        END LOOP;
        
      WHEN 'monthly' THEN
        WHILE next_booking_date <= end_date LOOP
          booking_datetime := next_booking_date + booking_time;
          
          IF NOT EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE recurring_group_id = rec.recurring_group_id 
              AND date_only = next_booking_date
          ) THEN
            INSERT INTO public.bookings (
              customer, cleaner, address, postcode, date_time, date_only, time_only,
              total_hours, total_cost, cleaning_type, frequently, booking_status,
              first_name, last_name, email, phone_number, recurring_group_id,
              cleaner_pay, payment_method, created_by_source
            ) VALUES (
              rec.customer, rec.cleaner, address_text, address_postcode,
              booking_datetime, next_booking_date, booking_time,
              service_hours, rec.total_cost, rec.cleaning_type, rec.frequently,
              'upcoming', rec.first_name, rec.last_name, rec.email, rec.phone,
              rec.recurring_group_id, calculated_cleaner_pay, rec.payment_method,
              'recurring_auto'
            );
          END IF;
          
          next_booking_date := next_booking_date + INTERVAL '1 month';
        END LOOP;
        
      ELSE
        CONTINUE;
    END CASE;
    
    -- Update was_created_until
    UPDATE public.recurring_services 
    SET was_created_until = end_date 
    WHERE id = rec.id;
    
  END LOOP;
END;
$$;