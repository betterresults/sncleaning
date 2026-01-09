-- Create function to sync cleaner_payments with bookings.cleaner for ALL changes
CREATE OR REPLACE FUNCTION sync_cleaner_payments_on_booking_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE: remove primary cleaner payment entry
  IF TG_OP = 'DELETE' THEN
    DELETE FROM cleaner_payments 
    WHERE booking_id = OLD.id AND is_primary = true;
    RETURN OLD;
  END IF;

  -- Handle INSERT: create payment entry if cleaner is assigned
  IF TG_OP = 'INSERT' THEN
    IF NEW.cleaner IS NOT NULL THEN
      INSERT INTO cleaner_payments (
        booking_id,
        cleaner_id,
        is_primary,
        payment_type,
        calculated_pay,
        hourly_rate,
        percentage_rate,
        status
      ) VALUES (
        NEW.id,
        NEW.cleaner,
        true,
        'percentage',
        COALESCE(NEW.cleaner_pay, 0),
        COALESCE(NEW.cleaner_rate, 0),
        COALESCE(NEW.cleaner_percentage, 0),
        'assigned'
      )
      ON CONFLICT (booking_id, cleaner_id) WHERE is_primary = true
      DO UPDATE SET
        calculated_pay = EXCLUDED.calculated_pay,
        hourly_rate = EXCLUDED.hourly_rate,
        percentage_rate = EXCLUDED.percentage_rate,
        updated_at = now();
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If cleaner was removed (set to NULL), delete the primary payment entry
    IF OLD.cleaner IS NOT NULL AND NEW.cleaner IS NULL THEN
      DELETE FROM cleaner_payments 
      WHERE booking_id = NEW.id AND cleaner_id = OLD.cleaner AND is_primary = true;
    
    -- If cleaner was changed to a different cleaner
    ELSIF OLD.cleaner IS DISTINCT FROM NEW.cleaner AND NEW.cleaner IS NOT NULL THEN
      -- Remove old cleaner's primary payment if exists
      IF OLD.cleaner IS NOT NULL THEN
        DELETE FROM cleaner_payments 
        WHERE booking_id = NEW.id AND cleaner_id = OLD.cleaner AND is_primary = true;
      END IF;
      
      -- Add new cleaner's payment entry
      INSERT INTO cleaner_payments (
        booking_id,
        cleaner_id,
        is_primary,
        payment_type,
        calculated_pay,
        hourly_rate,
        percentage_rate,
        status
      ) VALUES (
        NEW.id,
        NEW.cleaner,
        true,
        'percentage',
        COALESCE(NEW.cleaner_pay, 0),
        COALESCE(NEW.cleaner_rate, 0),
        COALESCE(NEW.cleaner_percentage, 0),
        'assigned'
      )
      ON CONFLICT (booking_id, cleaner_id) WHERE is_primary = true
      DO UPDATE SET
        calculated_pay = EXCLUDED.calculated_pay,
        hourly_rate = EXCLUDED.hourly_rate,
        percentage_rate = EXCLUDED.percentage_rate,
        updated_at = now();
    
    -- If same cleaner but pay details changed
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
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT, UPDATE, and DELETE
DROP TRIGGER IF EXISTS sync_cleaner_payments_trigger ON bookings;
CREATE TRIGGER sync_cleaner_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_cleaner_payments_on_booking_change();

-- Backfill: Add missing cleaner_payments entries for existing bookings
INSERT INTO cleaner_payments (booking_id, cleaner_id, is_primary, payment_type, calculated_pay, hourly_rate, percentage_rate, status)
SELECT 
  b.id,
  b.cleaner,
  true,
  'percentage',
  COALESCE(b.cleaner_pay, 0),
  COALESCE(b.cleaner_rate, 0),
  COALESCE(b.cleaner_percentage, 0),
  'assigned'
FROM bookings b
WHERE b.cleaner IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM cleaner_payments cp 
    WHERE cp.booking_id = b.id AND cp.is_primary = true
  )
ON CONFLICT DO NOTHING;