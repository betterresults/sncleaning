-- Delete incorrectly created recurring bookings (wrong days)
-- First delete associated cleaner_payments
DELETE FROM cleaner_payments WHERE booking_id IN (
  SELECT b.id FROM bookings b
  INNER JOIN recurring_services rs ON b.recurring_group_id = rs.recurring_group_id
  WHERE b.created_by_source = 'recurring_auto'
    AND b.booking_status = 'upcoming'
    AND b.date_only >= CURRENT_DATE
    AND EXTRACT(DOW FROM b.date_only)::INTEGER != CASE LOWER(TRIM(SPLIT_PART(rs.days_of_the_week, ',', 1)))
      WHEN 'sunday' THEN 0
      WHEN 'monday' THEN 1
      WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3
      WHEN 'thursday' THEN 4
      WHEN 'friday' THEN 5
      WHEN 'saturday' THEN 6
    END
);

-- Delete the wrong bookings
DELETE FROM bookings b
USING recurring_services rs
WHERE b.recurring_group_id = rs.recurring_group_id
  AND b.created_by_source = 'recurring_auto'
  AND b.booking_status = 'upcoming'
  AND b.date_only >= CURRENT_DATE
  AND EXTRACT(DOW FROM b.date_only)::INTEGER != CASE LOWER(TRIM(SPLIT_PART(rs.days_of_the_week, ',', 1)))
    WHEN 'sunday' THEN 0
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
  END;

-- Reset was_created_until so the function can regenerate correctly
UPDATE recurring_services SET was_created_until = NULL 
WHERE confirmed = true AND postponed IS NOT TRUE;