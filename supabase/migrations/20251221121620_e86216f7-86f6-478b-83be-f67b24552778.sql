-- Update the notify_booking_created function to NOT send confirmation email for card payments
-- Card payment bookings will receive confirmation email after Stripe confirms payment/card setup
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if send_notification_email is explicitly set to false
  IF NEW.send_notification_email IS DISTINCT FROM FALSE THEN
    -- For card payments, DON'T send confirmation immediately - wait for Stripe confirmation
    -- Only send immediately for bank transfers or other non-card payment methods
    IF NEW.payment_method IS NULL OR LOWER(NEW.payment_method) NOT IN ('card', 'stripe', 'credit card', 'debit card') THEN
      -- Send booking created notification for non-card payments
      PERFORM send_booking_notification(NEW.id, 'booking_created');
    ELSE
      -- For card payments, log that we're deferring the email
      RAISE NOTICE 'Booking % has card payment method - confirmation email will be sent after Stripe confirms payment/card setup', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;