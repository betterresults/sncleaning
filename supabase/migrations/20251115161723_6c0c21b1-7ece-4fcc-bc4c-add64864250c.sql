-- Function to automatically set cleaner_pay to 0 when booking is cancelled
CREATE OR REPLACE FUNCTION auto_zero_cleaner_pay_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if booking_status is being set to cancelled (case insensitive)
  IF NEW.booking_status IS NOT NULL AND LOWER(NEW.booking_status) IN ('cancelled', 'canceled') THEN
    NEW.cleaner_pay := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bookings table
DROP TRIGGER IF EXISTS trigger_zero_cleaner_pay_on_cancel ON bookings;
CREATE TRIGGER trigger_zero_cleaner_pay_on_cancel
  BEFORE INSERT OR UPDATE OF booking_status
  ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_zero_cleaner_pay_on_cancel();

-- Trigger for past_bookings table
DROP TRIGGER IF EXISTS trigger_zero_cleaner_pay_on_cancel_past ON past_bookings;
CREATE TRIGGER trigger_zero_cleaner_pay_on_cancel_past
  BEFORE INSERT OR UPDATE OF booking_status
  ON past_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_zero_cleaner_pay_on_cancel();

COMMENT ON FUNCTION auto_zero_cleaner_pay_on_cancel() IS 'Automatically sets cleaner_pay to 0 when booking_status is set to cancelled/canceled';