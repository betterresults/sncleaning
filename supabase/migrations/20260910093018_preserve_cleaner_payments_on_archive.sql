-- Completing/archiving a booking copies it to past_bookings then DELETEs it from
-- bookings. That DELETE fired sync_cleaner_payments_on_booking_change(), which
-- removed the primary cleaner_payments row. Ensure-on-past-insert ran first and
-- no-op'd because the row still existed, so every completed job vanished from
-- Cleaner Payments.
--
-- Keep payment rows when the booking is being archived (a past_bookings row with
-- the same id already exists). Still delete them on a true booking delete.
-- Upsert on past_bookings insert so a missing row is recreated. Backfill gaps.

CREATE OR REPLACE FUNCTION public.sync_cleaner_payments_on_booking_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM past_bookings WHERE id = OLD.id) THEN
      RETURN OLD;
    END IF;

    DELETE FROM cleaner_payments
    WHERE booking_id = OLD.id AND is_primary = true;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.cleaner IS NOT NULL THEN
      INSERT INTO cleaner_payments (
        booking_id, cleaner_id, is_primary, payment_type,
        calculated_pay, hourly_rate, percentage_rate, status
      ) VALUES (
        NEW.id, NEW.cleaner, true, 'percentage',
        COALESCE(NEW.cleaner_pay, 0), COALESCE(NEW.cleaner_rate, 0),
        COALESCE(NEW.cleaner_percentage, 0), 'assigned'
      )
      ON CONFLICT (booking_id, cleaner_id)
      DO UPDATE SET
        calculated_pay = EXCLUDED.calculated_pay,
        hourly_rate = EXCLUDED.hourly_rate,
        percentage_rate = EXCLUDED.percentage_rate,
        is_primary = true,
        updated_at = now();
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.cleaner IS NOT NULL AND NEW.cleaner IS NULL THEN
      DELETE FROM cleaner_payments
      WHERE booking_id = NEW.id AND cleaner_id = OLD.cleaner AND is_primary = true;
    ELSIF OLD.cleaner IS DISTINCT FROM NEW.cleaner AND NEW.cleaner IS NOT NULL THEN
      IF OLD.cleaner IS NOT NULL THEN
        DELETE FROM cleaner_payments
        WHERE booking_id = NEW.id AND cleaner_id = OLD.cleaner AND is_primary = true;
      END IF;
      INSERT INTO cleaner_payments (
        booking_id, cleaner_id, is_primary, payment_type,
        calculated_pay, hourly_rate, percentage_rate, status
      ) VALUES (
        NEW.id, NEW.cleaner, true, 'percentage',
        COALESCE(NEW.cleaner_pay, 0), COALESCE(NEW.cleaner_rate, 0),
        COALESCE(NEW.cleaner_percentage, 0), 'assigned'
      )
      ON CONFLICT (booking_id, cleaner_id)
      DO UPDATE SET
        calculated_pay = EXCLUDED.calculated_pay,
        hourly_rate = EXCLUDED.hourly_rate,
        percentage_rate = EXCLUDED.percentage_rate,
        is_primary = true,
        updated_at = now();
    ELSIF NEW.cleaner IS NOT NULL AND (
      OLD.cleaner_pay IS DISTINCT FROM NEW.cleaner_pay OR
      OLD.cleaner_rate IS DISTINCT FROM NEW.cleaner_rate OR
      OLD.cleaner_percentage IS DISTINCT FROM NEW.cleaner_percentage
    ) THEN
      UPDATE cleaner_payments
      SET
        calculated_pay = COALESCE(NEW.cleaner_pay, 0),
        hourly_rate = COALESCE(NEW.cleaner_rate, 0),
        percentage_rate = COALESCE(NEW.cleaner_percentage, 0),
        updated_at = now()
      WHERE booking_id = NEW.id AND cleaner_id = NEW.cleaner AND is_primary = true;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_cleaner_payment_on_past_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.cleaner IS NOT NULL
     AND (NEW.booking_status IS NULL OR NEW.booking_status NOT ILIKE '%cancel%') THEN
    INSERT INTO cleaner_payments (
      booking_id, cleaner_id, calculated_pay, payment_type, is_primary, status
    ) VALUES (
      NEW.id, NEW.cleaner, COALESCE(NEW.cleaner_pay, 0), 'percentage', true, 'assigned'
    )
    ON CONFLICT (booking_id, cleaner_id)
    DO UPDATE SET
      calculated_pay = EXCLUDED.calculated_pay,
      is_primary = true,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

INSERT INTO cleaner_payments (
  booking_id, cleaner_id, calculated_pay, payment_type, is_primary, status
)
SELECT
  pb.id,
  pb.cleaner,
  COALESCE(pb.cleaner_pay, 0),
  'percentage',
  true,
  'assigned'
FROM past_bookings pb
WHERE pb.cleaner IS NOT NULL
  AND (pb.booking_status IS NULL OR pb.booking_status NOT ILIKE '%cancel%')
  AND NOT EXISTS (
    SELECT 1
    FROM cleaner_payments cp
    WHERE cp.booking_id = pb.id
      AND cp.cleaner_id = pb.cleaner
  );
