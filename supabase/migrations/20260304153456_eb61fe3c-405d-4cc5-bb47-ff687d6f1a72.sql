CREATE OR REPLACE FUNCTION public.generate_recurring_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  next_booking_date DATE;
  booking_datetime TIMESTAMP WITH TIME ZONE;
  booking_time TIME;
  address_text TEXT;
  address_postcode TEXT;
  service_hours NUMERIC;
  calculated_cleaner_pay NUMERIC;
  target_dow INTEGER;
  days_until_target INTEGER;
  base_date DATE;
  freq_interval INTERVAL;
BEGIN
  FOR rec IN
    SELECT 
      rs.id,
      rs.customer,
      rs.cleaner,
      rs.address,
      rs.start_date,
      rs.start_time,
      rs.hours,
      rs.total_cost,
      rs.cost_per_hour,
      rs.cleaner_rate,
      rs.cleaning_type,
      rs.frequently,
      rs.days_of_the_week,
      rs.was_created_until,
      rs.recurring_group_id,
      rs.payment_method,
      c.first_name,
      c.last_name,
      c.email,
      c.phone
    FROM recurring_services rs
    LEFT JOIN customers c ON rs.customer = c.id
    WHERE rs.confirmed = true
      AND rs.postponed IS NOT TRUE
      AND rs.start_time IS NOT NULL
      AND rs.start_date IS NOT NULL
      AND rs.days_of_the_week IS NOT NULL
  LOOP
    -- Determine frequency interval
    CASE LOWER(REPLACE(rec.frequently, '-', ''))
      WHEN 'weekly' THEN freq_interval := INTERVAL '7 days';
      WHEN 'biweekly' THEN freq_interval := INTERVAL '14 days';
      WHEN 'monthly' THEN freq_interval := INTERVAL '30 days';
      ELSE freq_interval := INTERVAL '7 days';
    END CASE;

    -- Convert days_of_the_week to PostgreSQL DOW (0=Sunday, 1=Monday, ..., 6=Saturday)
    target_dow := CASE LOWER(TRIM(SPLIT_PART(rec.days_of_the_week, ',', 1)))
      WHEN 'sunday' THEN 0
      WHEN 'monday' THEN 1
      WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3
      WHEN 'thursday' THEN 4
      WHEN 'friday' THEN 5
      WHEN 'saturday' THEN 6
      ELSE NULL
    END;
    
    IF target_dow IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Determine the next booking date
    IF rec.was_created_until IS NOT NULL THEN
      -- CRITICAL FIX: Add the frequency interval from was_created_until,
      -- not just 1 day. This ensures bi-weekly/monthly bookings aren't created weekly.
      next_booking_date := rec.was_created_until + freq_interval;
      
      -- If next_booking_date is in the past, advance it forward in freq_interval steps
      WHILE next_booking_date < CURRENT_DATE LOOP
        next_booking_date := next_booking_date + freq_interval;
      END LOOP;
      
      -- Snap to the correct day of week if needed (should already be correct)
      IF EXTRACT(DOW FROM next_booking_date)::INTEGER != target_dow THEN
        days_until_target := (target_dow - EXTRACT(DOW FROM next_booking_date)::INTEGER + 7) % 7;
        IF days_until_target = 0 THEN
          days_until_target := 7;
        END IF;
        next_booking_date := next_booking_date + days_until_target;
      END IF;
    ELSE
      -- First time: start from start_date or today
      base_date := GREATEST(rec.start_date::DATE, CURRENT_DATE);
      
      IF EXTRACT(DOW FROM base_date)::INTEGER = target_dow THEN
        next_booking_date := base_date;
      ELSE
        days_until_target := (target_dow - EXTRACT(DOW FROM base_date)::INTEGER + 7) % 7;
        IF days_until_target = 0 THEN
          days_until_target := 7;
        END IF;
        next_booking_date := base_date + days_until_target;
      END IF;
    END IF;
    
    service_hours := COALESCE(rec.hours::NUMERIC, 3);
    calculated_cleaner_pay := ROUND(service_hours * COALESCE(rec.cleaner_rate, 0), 2);
    
    SELECT a.address, a.postcode INTO address_text, address_postcode
    FROM addresses a WHERE a.id = rec.address::UUID;
    
    booking_time := rec.start_time::TIME;
    
    -- Generate bookings up to 30 days ahead
    WHILE next_booking_date <= CURRENT_DATE + INTERVAL '30 days' LOOP
      booking_datetime := (next_booking_date || ' ' || booking_time)::TIMESTAMP WITH TIME ZONE;
      
      IF NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE recurring_group_id = rec.recurring_group_id 
          AND date_only = next_booking_date
      ) THEN
        INSERT INTO bookings (
          customer, cleaner, address, postcode, date_time, date_only, time_only,
          total_hours, total_cost, cleaning_type, frequently, booking_status,
          first_name, last_name, email, phone_number, recurring_group_id,
          cleaner_pay, cleaner_rate, payment_method, created_by_source
        ) VALUES (
          rec.customer, rec.cleaner, address_text, address_postcode, booking_datetime,
          next_booking_date, booking_time,
          service_hours, rec.total_cost, rec.cleaning_type, rec.frequently, 'upcoming',
          rec.first_name, rec.last_name, rec.email, rec.phone, rec.recurring_group_id,
          calculated_cleaner_pay, rec.cleaner_rate, rec.payment_method, 'recurring_auto'
        );
      END IF;
      
      UPDATE recurring_services SET was_created_until = next_booking_date WHERE id = rec.id;
      
      -- Advance by frequency interval
      next_booking_date := next_booking_date + freq_interval;
    END LOOP;
  END LOOP;
END;
$$;