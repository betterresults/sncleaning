
-- Fix 1: Update notify_booking_created to skip emails for auto-generated recurring bookings
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip if send_notification_email is explicitly set to false
  IF NEW.send_notification_email IS DISTINCT FROM FALSE THEN
    -- Skip emails for auto-generated recurring bookings (they are generated in bulk)
    IF NEW.created_by_source = 'recurring_auto' THEN
      RAISE NOTICE 'Booking % is auto-generated recurring - skipping confirmation email', NEW.id;
      RETURN NEW;
    END IF;
    
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
$function$;

-- Fix 2: Delete Rebecca's incorrect Feb 6 booking (should be ~Feb 27 for monthly)
DELETE FROM cleaner_payments WHERE booking_id = 110956;
DELETE FROM bookings WHERE id = 110956;

-- Fix 3: Reset Rebecca's was_created_until to Jan 30 so next run creates correct Feb 27
UPDATE recurring_services 
SET was_created_until = '2026-01-30'
WHERE id = 43;
