-- Modify triggers to skip automatic emails for admin actions
-- We'll add a way to detect admin actions and skip automatic emails

-- Update the booking confirmation email trigger to skip for admin actions
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
  current_user_role text;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  -- Skip automatic email for admin actions
  IF current_user_role = 'admin' THEN
    RETURN NEW;
  END IF;

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

-- Update the booking status update email trigger to skip for admin actions
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
  current_user_role text;
BEGIN
  -- Only send if status actually changed
  IF OLD.booking_status IS NOT DISTINCT FROM NEW.booking_status THEN
    RETURN NEW;
  END IF;
  
  -- Check if current user is admin
  SELECT role INTO current_user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  -- Skip automatic email for admin actions
  IF current_user_role = 'admin' THEN
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

-- Update the booking completion email trigger to skip for admin actions
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
  current_user_role text;
BEGIN
  -- Only send if status changed to completed
  IF NEW.booking_status != 'completed' OR OLD.booking_status = 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Check if current user is admin
  SELECT role INTO current_user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  -- Skip automatic email for admin actions
  IF current_user_role = 'admin' THEN
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

-- Update the payment reminder email trigger to skip for admin actions
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
  current_user_role text;
BEGIN
  -- Only send if payment status changed and is now overdue or failed
  IF OLD.payment_status IS NOT DISTINCT FROM NEW.payment_status THEN
    RETURN NEW;
  END IF;
  
  IF NEW.payment_status NOT IN ('overdue', 'failed') THEN
    RETURN NEW;
  END IF;
  
  -- Check if current user is admin
  SELECT role INTO current_user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  -- Skip automatic email for admin actions
  IF current_user_role = 'admin' THEN
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

-- Create a function to manually send booking emails with admin control
CREATE OR REPLACE FUNCTION public.send_manual_booking_email(
  p_booking_id bigint,
  p_email_type text,
  p_additional_variables jsonb DEFAULT '{}'::jsonb
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  booking_record RECORD;
  customer_record RECORD;
  template_record RECORD;
  variables jsonb;
  result json;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get booking details
  SELECT * INTO booking_record
  FROM bookings
  WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Get customer details
  SELECT first_name, last_name, email
  INTO customer_record
  FROM customers
  WHERE id = booking_record.customer;
  
  IF customer_record.email IS NULL OR customer_record.email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Customer has no email address');
  END IF;
  
  -- Get template based on email type
  SELECT id INTO template_record
  FROM email_notification_templates
  WHERE name = p_email_type AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Email template not found');
  END IF;
  
  -- Prepare variables for the email template
  variables := jsonb_build_object(
    'customer_name', COALESCE(customer_record.first_name || ' ' || customer_record.last_name, customer_record.first_name, 'Customer'),
    'booking_date', to_char(booking_record.date_time, 'DD/MM/YYYY'),
    'booking_time', to_char(booking_record.date_time, 'HH24:MI'),
    'booking_address', booking_record.address,
    'total_cost', booking_record.total_cost::text,
    'booking_id', booking_record.id::text,
    'booking_status', booking_record.booking_status,
    'payment_status', booking_record.payment_status
  );
  
  -- Merge with additional variables
  variables := variables || p_additional_variables;
  
  -- Send the notification
  PERFORM send_email_notification(template_record.id, customer_record.email, variables);
  
  RETURN json_build_object('success', true, 'message', 'Email sent successfully');
END;
$$;