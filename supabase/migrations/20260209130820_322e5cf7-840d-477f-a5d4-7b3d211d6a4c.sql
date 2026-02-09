-- Fix: Send confirmation email immediately for sales_agent-created bookings
-- regardless of payment method. Only defer for website/public card payments.
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
    
    -- For sales_agent or admin created bookings, ALWAYS send confirmation immediately
    IF NEW.created_by_source IN ('sales_agent', 'admin') THEN
      PERFORM send_booking_notification(NEW.id, 'booking_created');
      RETURN NEW;
    END IF;
    
    -- For website/public bookings with card payments, defer email until Stripe confirms
    IF NEW.payment_method IS NULL OR LOWER(NEW.payment_method) NOT IN ('card', 'stripe', 'credit card', 'debit card') THEN
      PERFORM send_booking_notification(NEW.id, 'booking_created');
    ELSE
      RAISE NOTICE 'Booking % has card payment method - confirmation email will be sent after Stripe confirms payment/card setup', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;