-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_booking_confirmation_email ON bookings;
DROP TRIGGER IF EXISTS trigger_booking_status_update_email ON bookings;
DROP TRIGGER IF EXISTS trigger_booking_completion_email ON bookings;
DROP TRIGGER IF EXISTS trigger_payment_reminder_email ON bookings;

-- Create function to send notification emails based on triggers (fixed)
CREATE OR REPLACE FUNCTION public.send_email_notification(
  p_template_id uuid,
  p_recipient_email text,
  p_variables jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  template_record RECORD;
BEGIN
  -- Get the email template
  SELECT * INTO template_record
  FROM email_notification_templates ent
  WHERE ent.id = p_template_id AND ent.is_active = true;
    
  IF NOT FOUND THEN
    RETURN; -- No active template found
  END IF;

  -- Call the edge function to send the email
  PERFORM net.http_post(
    url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-notification-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
    body := json_build_object(
      'template_id', p_template_id,
      'recipient_email', p_recipient_email,
      'variables', p_variables
    )::jsonb
  );
END;
$$;

-- Function to send booking confirmation email
CREATE OR REPLACE FUNCTION public.send_booking_confirmation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_record RECORD;
  template_record RECORD;
  variables jsonb;
BEGIN
  -- Get template for booking confirmation
  SELECT id INTO template_record
  FROM email_notification_templates
  WHERE name = 'booking_confirmation' AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NEW; -- No template found
  END IF;

  -- Get customer details
  SELECT first_name, last_name, email
  INTO customer_record
  FROM customers
  WHERE id = NEW.customer;
  
  -- Skip if no email
  IF customer_record.email IS NULL OR customer_record.email = '' THEN
    RETURN NEW;
  END IF;
  
  -- Prepare variables for the email template
  variables := jsonb_build_object(
    'customer_name', COALESCE(customer_record.first_name || ' ' || customer_record.last_name, customer_record.first_name, 'Customer'),
    'booking_date', to_char(NEW.date_time, 'DD/MM/YYYY'),
    'booking_time', to_char(NEW.date_time, 'HH24:MI'),
    'booking_address', NEW.address,
    'total_cost', NEW.total_cost::text,
    'booking_id', NEW.id::text
  );
  
  -- Send the notification
  PERFORM send_email_notification(template_record.id, customer_record.email, variables);
  
  RETURN NEW;
END;
$$;

-- Function to send booking status update email
CREATE OR REPLACE FUNCTION public.send_booking_status_update_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_record RECORD;
  template_record RECORD;
  variables jsonb;
BEGIN
  -- Only send if status actually changed
  IF OLD.booking_status IS NOT DISTINCT FROM NEW.booking_status THEN
    RETURN NEW;
  END IF;
  
  -- Get template for booking status update
  SELECT id INTO template_record
  FROM email_notification_templates
  WHERE name = 'booking_status_update' AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NEW; -- No template found
  END IF;
  
  -- Get customer details
  SELECT first_name, last_name, email
  INTO customer_record
  FROM customers
  WHERE id = NEW.customer;
  
  -- Skip if no email
  IF customer_record.email IS NULL OR customer_record.email = '' THEN
    RETURN NEW;
  END IF;
  
  -- Prepare variables for the email template
  variables := jsonb_build_object(
    'customer_name', COALESCE(customer_record.first_name || ' ' || customer_record.last_name, customer_record.first_name, 'Customer'),
    'booking_date', to_char(NEW.date_time, 'DD/MM/YYYY'),
    'booking_time', to_char(NEW.date_time, 'HH24:MI'),
    'booking_address', NEW.address,
    'old_status', OLD.booking_status,
    'new_status', NEW.booking_status,
    'booking_id', NEW.id::text
  );
  
  -- Send the notification
  PERFORM send_email_notification(template_record.id, customer_record.email, variables);
  
  RETURN NEW;
END;
$$;

-- Function to send booking completion email
CREATE OR REPLACE FUNCTION public.send_booking_completion_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_record RECORD;
  template_record RECORD;
  variables jsonb;
BEGIN
  -- Only send if status changed to completed
  IF NEW.booking_status != 'completed' OR OLD.booking_status = 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Get template for booking completion
  SELECT id INTO template_record
  FROM email_notification_templates
  WHERE name = 'booking_completion' AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NEW; -- No template found
  END IF;
  
  -- Get customer details
  SELECT first_name, last_name, email
  INTO customer_record
  FROM customers
  WHERE id = NEW.customer;
  
  -- Skip if no email
  IF customer_record.email IS NULL OR customer_record.email = '' THEN
    RETURN NEW;
  END IF;
  
  -- Prepare variables for the email template
  variables := jsonb_build_object(
    'customer_name', COALESCE(customer_record.first_name || ' ' || customer_record.last_name, customer_record.first_name, 'Customer'),
    'booking_date', to_char(NEW.date_time, 'DD/MM/YYYY'),
    'booking_time', to_char(NEW.date_time, 'HH24:MI'),
    'booking_address', NEW.address,
    'total_cost', NEW.total_cost::text,
    'booking_id', NEW.id::text
  );
  
  -- Send the notification
  PERFORM send_email_notification(template_record.id, customer_record.email, variables);
  
  RETURN NEW;
END;
$$;

-- Function to send payment reminder email
CREATE OR REPLACE FUNCTION public.send_payment_reminder_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_record RECORD;
  template_record RECORD;
  variables jsonb;
BEGIN
  -- Only send if payment status changed and is now overdue or failed
  IF OLD.payment_status IS NOT DISTINCT FROM NEW.payment_status THEN
    RETURN NEW;
  END IF;
  
  IF NEW.payment_status NOT IN ('overdue', 'failed') THEN
    RETURN NEW;
  END IF;
  
  -- Get template for payment reminder
  SELECT id INTO template_record
  FROM email_notification_templates
  WHERE name = 'payment_reminder' AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NEW; -- No template found
  END IF;
  
  -- Get customer details
  SELECT first_name, last_name, email
  INTO customer_record
  FROM customers
  WHERE id = NEW.customer;
  
  -- Skip if no email
  IF customer_record.email IS NULL OR customer_record.email = '' THEN
    RETURN NEW;
  END IF;
  
  -- Prepare variables for the email template
  variables := jsonb_build_object(
    'customer_name', COALESCE(customer_record.first_name || ' ' || customer_record.last_name, customer_record.first_name, 'Customer'),
    'booking_date', to_char(NEW.date_time, 'DD/MM/YYYY'),
    'booking_address', NEW.address,
    'total_cost', NEW.total_cost::text,
    'payment_status', NEW.payment_status,
    'booking_id', NEW.id::text
  );
  
  -- Send the notification
  PERFORM send_email_notification(template_record.id, customer_record.email, variables);
  
  RETURN NEW;
END;
$$;

-- Create triggers for bookings table
CREATE TRIGGER trigger_booking_confirmation_email
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_confirmation_email();

CREATE TRIGGER trigger_booking_status_update_email
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_status_update_email();

CREATE TRIGGER trigger_booking_completion_email
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_completion_email();

CREATE TRIGGER trigger_payment_reminder_email
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_payment_reminder_email();