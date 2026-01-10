-- Fix generate_recurring_bookings to properly calculate first booking date based on days_of_the_week
CREATE OR REPLACE FUNCTION generate_recurring_bookings()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
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
  target_dow INTEGER; -- 0=Sunday, 1=Monday, ..., 6=Saturday
  days_until_target INTEGER;
  base_date DATE;
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
    
    -- Skip if we couldn't parse the day
    IF target_dow IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Determine base date (either after was_created_until or from start_date)
    IF rec.was_created_until IS NOT NULL THEN
      -- Start from day after was_created_until, but never in the past
      base_date := GREATEST(rec.was_created_until + INTERVAL '1 day', CURRENT_DATE);
    ELSE
      -- First time: start from start_date, but never in the past
      base_date := GREATEST(rec.start_date::DATE, CURRENT_DATE);
    END IF;
    
    -- Calculate next occurrence of target day of week on or after base_date
    IF EXTRACT(DOW FROM base_date)::INTEGER = target_dow THEN
      -- base_date is already the target day
      next_booking_date := base_date;
    ELSE
      -- Calculate days until next occurrence
      days_until_target := (target_dow - EXTRACT(DOW FROM base_date)::INTEGER + 7) % 7;
      IF days_until_target = 0 THEN
        days_until_target := 7; -- If same day but we need next week
      END IF;
      next_booking_date := base_date + days_until_target;
    END IF;
    
    -- Parse hours
    service_hours := COALESCE(rec.hours::NUMERIC, 3);
    
    -- Calculate cleaner pay
    calculated_cleaner_pay := ROUND(service_hours * COALESCE(rec.cleaner_rate, 0), 2);
    
    -- Get address details
    SELECT a.address, a.postcode INTO address_text, address_postcode
    FROM addresses a WHERE a.id = rec.address::UUID;
    
    -- Parse time
    booking_time := rec.start_time::TIME;
    
    -- Generate bookings up to 30 days ahead
    WHILE next_booking_date <= CURRENT_DATE + INTERVAL '30 days' LOOP
      -- Create datetime
      booking_datetime := (next_booking_date || ' ' || booking_time)::TIMESTAMP WITH TIME ZONE;
      
      -- Check if booking already exists
      IF NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE recurring_group_id = rec.recurring_group_id 
          AND date_only = next_booking_date
      ) THEN
        -- Insert the booking
        INSERT INTO bookings (
          customer, cleaner, address, postcode, date_time, date_only, time_only,
          total_hours, total_cost, cleaning_type, frequently, booking_status,
          first_name, last_name, email, phone_number, recurring_group_id,
          cleaner_pay, payment_method, created_by_source
        ) VALUES (
          rec.customer, rec.cleaner, address_text, address_postcode, booking_datetime,
          next_booking_date, booking_time,
          service_hours, rec.total_cost, rec.cleaning_type, rec.frequently, 'upcoming',
          rec.first_name, rec.last_name, rec.email, rec.phone, rec.recurring_group_id,
          calculated_cleaner_pay, rec.payment_method, 'recurring_auto'
        );
        
        -- Create cleaner payment entry if cleaner assigned
        IF rec.cleaner IS NOT NULL THEN
          INSERT INTO cleaner_payments (
            booking_id, cleaner_id, payment_type, hourly_rate, hours_assigned,
            calculated_pay, status, is_primary
          ) VALUES (
            (SELECT id FROM bookings WHERE recurring_group_id = rec.recurring_group_id AND date_only = next_booking_date ORDER BY id DESC LIMIT 1),
            rec.cleaner, 'hourly', rec.cleaner_rate, service_hours,
            calculated_cleaner_pay, 'pending', true
          );
        END IF;
      END IF;
      
      -- Update was_created_until
      UPDATE recurring_services SET was_created_until = next_booking_date WHERE id = rec.id;
      
      -- Advance to next occurrence based on frequency
      CASE LOWER(REPLACE(rec.frequently, '-', ''))
        WHEN 'weekly' THEN next_booking_date := next_booking_date + INTERVAL '7 days';
        WHEN 'biweekly' THEN next_booking_date := next_booking_date + INTERVAL '14 days';
        WHEN 'monthly' THEN next_booking_date := next_booking_date + INTERVAL '30 days';
        ELSE next_booking_date := next_booking_date + INTERVAL '7 days';
      END CASE;
    END LOOP;
  END LOOP;
END;
$$;

-- Delete any backdated bookings that were incorrectly created
DELETE FROM cleaner_payments WHERE booking_id IN (
  SELECT id FROM bookings 
  WHERE booking_status = 'upcoming' 
    AND created_by_source = 'recurring_auto'
    AND date_only < CURRENT_DATE
);

DELETE FROM bookings 
WHERE booking_status = 'upcoming' 
  AND created_by_source = 'recurring_auto'
  AND date_only < CURRENT_DATE;