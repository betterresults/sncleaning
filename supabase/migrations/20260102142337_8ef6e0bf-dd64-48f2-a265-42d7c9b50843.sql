-- Add confirmed column to recurring_services table
-- This controls whether future bookings should be automatically generated
-- New recurring services start as unconfirmed (false) until first clean is completed
ALTER TABLE public.recurring_services ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.recurring_services.confirmed IS 'Whether the recurring service is confirmed and should generate future bookings. False until first clean is completed and admin confirms.';

-- Update the generate_recurring_bookings function to only process confirmed services
CREATE OR REPLACE FUNCTION public.generate_recurring_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  service RECORD;
  next_date DATE;
  end_gen_date DATE;
  new_booking_id BIGINT;
  booking_exists BOOLEAN;
  day_of_week_num INT;
  target_day INT;
  days_until_target INT;
  generated_count INT := 0;
  skipped_count INT := 0;
  service_count INT := 0;
BEGIN
  RAISE NOTICE 'Starting generate_recurring_bookings at %', NOW();
  
  -- Set end date to 8 weeks from now
  end_gen_date := CURRENT_DATE + INTERVAL '8 weeks';
  RAISE NOTICE 'Generating bookings until %', end_gen_date;
  
  -- Loop through all active, confirmed recurring services that have a start_time set
  FOR service IN 
    SELECT * FROM recurring_services 
    WHERE status = 'active' 
      AND confirmed = TRUE
      AND start_time IS NOT NULL
  LOOP
    service_count := service_count + 1;
    RAISE NOTICE 'Processing service ID: %, Customer: %, Frequency: %, Interval: % weeks, Day: %', 
      service.id, service.customer_id, service.frequency, service.interval_weeks, service.day_of_week;
    
    -- Determine the starting point for generating new bookings
    IF service.next_service_date IS NOT NULL AND service.next_service_date > CURRENT_DATE THEN
      next_date := service.next_service_date;
    ELSE
      next_date := CURRENT_DATE;
    END IF;
    
    RAISE NOTICE 'Starting from date: %', next_date;
    
    -- For weekly/bi-weekly, align to the correct day of the week
    IF service.frequency IN ('weekly', 'bi-weekly') AND service.day_of_week IS NOT NULL THEN
      -- Convert day name to number (0 = Sunday, 1 = Monday, etc.)
      target_day := CASE service.day_of_week
        WHEN 'Sunday' THEN 0
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        ELSE 1  -- Default to Monday
      END;
      
      -- Get current day of week
      day_of_week_num := EXTRACT(DOW FROM next_date);
      
      -- Calculate days until target day
      days_until_target := target_day - day_of_week_num;
      IF days_until_target <= 0 THEN
        days_until_target := days_until_target + 7;
      END IF;
      
      next_date := next_date + days_until_target;
      RAISE NOTICE 'Aligned to day of week, next_date: %', next_date;
    END IF;
    
    -- Generate bookings until end date
    WHILE next_date <= end_gen_date LOOP
      -- Check if booking already exists for this date and service
      SELECT EXISTS (
        SELECT 1 FROM bookings 
        WHERE recurring_group_id = service.id 
          AND date_only = next_date
          AND booking_status != 'cancelled'
      ) INTO booking_exists;
      
      IF NOT booking_exists THEN
        RAISE NOTICE 'Creating booking for date: %', next_date;
        
        -- Create the booking
        INSERT INTO bookings (
          customer,
          address,
          postcode,
          cleaning_type,
          service_type,
          date_only,
          time_only,
          date_time,
          total_hours,
          hours_required,
          cleaning_cost_per_hour,
          total_cost,
          payment_method,
          cleaner,
          cleaner_rate,
          cleaner_pay,
          booking_status,
          recurring_group_id,
          frequently,
          created_by_source
        )
        SELECT
          service.customer_id,
          a.address,
          a.postcode,
          service.cleaning_type,
          'Domestic Cleaning',
          next_date,
          service.start_time,
          (next_date || ' ' || service.start_time)::TIMESTAMP WITH TIME ZONE,
          service.hours,
          service.hours,
          service.cost_per_hour,
          service.total_cost,
          service.payment_method,
          service.cleaner_id,
          service.cleaner_rate,
          CASE 
            WHEN service.cleaner_rate IS NOT NULL THEN service.hours * service.cleaner_rate
            ELSE NULL
          END,
          'active',
          service.id,
          service.frequency,
          'recurring_auto'
        FROM addresses a
        WHERE a.id = service.address_id
        RETURNING id INTO new_booking_id;
        
        IF new_booking_id IS NOT NULL THEN
          generated_count := generated_count + 1;
          RAISE NOTICE 'Created booking ID: %', new_booking_id;
          
          -- Create cleaner_payments entry if cleaner is assigned
          IF service.cleaner_id IS NOT NULL THEN
            INSERT INTO cleaner_payments (
              booking_id,
              cleaner_id,
              payment_type,
              hourly_rate,
              hours_assigned,
              calculated_pay,
              is_primary,
              status
            ) VALUES (
              new_booking_id,
              service.cleaner_id,
              'hourly',
              service.cleaner_rate,
              service.hours,
              COALESCE(service.hours * service.cleaner_rate, 0),
              true,
              'assigned'
            );
            RAISE NOTICE 'Created cleaner_payment for booking %', new_booking_id;
          END IF;
        END IF;
      ELSE
        skipped_count := skipped_count + 1;
        RAISE NOTICE 'Booking already exists for date: %, skipping', next_date;
      END IF;
      
      -- Move to next occurrence based on frequency
      CASE service.frequency
        WHEN 'weekly' THEN
          next_date := next_date + INTERVAL '1 week';
        WHEN 'bi-weekly' THEN
          next_date := next_date + INTERVAL '2 weeks';
        WHEN 'monthly' THEN
          next_date := next_date + INTERVAL '1 month';
        ELSE
          next_date := next_date + (service.interval_weeks || ' weeks')::INTERVAL;
      END CASE;
    END LOOP;
    
    -- Update next_service_date on the recurring service
    UPDATE recurring_services 
    SET next_service_date = next_date,
        updated_at = NOW()
    WHERE id = service.id;
    
  END LOOP;
  
  RAISE NOTICE 'Completed generate_recurring_bookings: Processed % services, Generated % bookings, Skipped % (already existed)', 
    service_count, generated_count, skipped_count;
END;
$$;