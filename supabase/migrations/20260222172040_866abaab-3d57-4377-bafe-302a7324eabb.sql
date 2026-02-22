
-- 1. Backfill missing cleaner_payments for past_bookings that have a cleaner but no payment record
INSERT INTO cleaner_payments (booking_id, cleaner_id, calculated_pay, payment_type, is_primary, status)
SELECT 
  pb.id,
  pb.cleaner,
  COALESCE(pb.cleaner_pay, 0),
  'percentage',
  true,
  'assigned'
FROM past_bookings pb
WHERE pb.cleaner IS NOT NULL
AND (pb.booking_status IS NULL OR pb.booking_status != 'cancelled')
AND NOT EXISTS (
  SELECT 1 FROM cleaner_payments cp WHERE cp.booking_id = pb.id AND cp.cleaner_id = pb.cleaner
);

-- 2. Create trigger to auto-create cleaner_payments when a booking is inserted into past_bookings
CREATE OR REPLACE FUNCTION public.ensure_cleaner_payment_on_past_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only proceed if cleaner is assigned and booking is not cancelled
  IF NEW.cleaner IS NOT NULL 
     AND (NEW.booking_status IS NULL OR NEW.booking_status != 'cancelled') THEN
    -- Check if a cleaner_payments record already exists
    IF NOT EXISTS (
      SELECT 1 FROM cleaner_payments 
      WHERE booking_id = NEW.id AND cleaner_id = NEW.cleaner
    ) THEN
      INSERT INTO cleaner_payments (
        booking_id, cleaner_id, calculated_pay, payment_type, is_primary, status
      ) VALUES (
        NEW.id, NEW.cleaner, COALESCE(NEW.cleaner_pay, 0), 'percentage', true, 'assigned'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER ensure_cleaner_payment_on_past_booking_insert
AFTER INSERT ON past_bookings
FOR EACH ROW
EXECUTE FUNCTION ensure_cleaner_payment_on_past_booking();
