-- Create function to send notification emails based on triggers
CREATE OR REPLACE FUNCTION public.send_email_notification(
  p_template_name text,
  p_recipient_email text,
  p_variables jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  template_record RECORD;
  trigger_record RECORD;
BEGIN
  -- Check if there's an active trigger for this template
  SELECT nt.*, ent.id as template_id
  INTO trigger_record
  FROM notification_triggers nt
  JOIN email_notification_templates ent ON nt.template_name = ent.name
  WHERE nt.template_name = p_template_name
    AND nt.is_active = true
    AND ent.is_active = true;
    
  IF NOT FOUND THEN
    RETURN; -- No active trigger found
  END IF;

  -- Call the edge function to send the email
  PERFORM net.http_post(
    url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-notification-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
    body := json_build_object(
      'template_id', trigger_record.template_id,
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
  variables jsonb;
BEGIN
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
  PERFORM send_email_notification('booking_confirmation', customer_record.email, variables);
  
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
  variables jsonb;
BEGIN
  -- Only send if status actually changed
  IF OLD.booking_status IS NOT DISTINCT FROM NEW.booking_status THEN
    RETURN NEW;
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
  PERFORM send_email_notification('booking_status_update', customer_record.email, variables);
  
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
  variables jsonb;
BEGIN
  -- Only send if status changed to completed
  IF NEW.booking_status != 'completed' OR OLD.booking_status = 'completed' THEN
    RETURN NEW;
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
  PERFORM send_email_notification('booking_completion', customer_record.email, variables);
  
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
  variables jsonb;
BEGIN
  -- Only send if payment status changed and is now overdue or failed
  IF OLD.payment_status IS NOT DISTINCT FROM NEW.payment_status THEN
    RETURN NEW;
  END IF;
  
  IF NEW.payment_status NOT IN ('overdue', 'failed') THEN
    RETURN NEW;
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
  PERFORM send_email_notification('payment_reminder', customer_record.email, variables);
  
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

-- Add some additional default email templates for the triggers
INSERT INTO email_notification_templates (name, subject, html_content, description, is_active) VALUES
('booking_confirmation', 'Booking Confirmation - {{booking_date}}', 
'<h2>Booking Confirmation</h2>
<p>Dear {{customer_name}},</p>
<p>Your cleaning booking has been confirmed for:</p>
<ul>
<li><strong>Date:</strong> {{booking_date}} at {{booking_time}}</li>
<li><strong>Address:</strong> {{booking_address}}</li>
<li><strong>Total Cost:</strong> £{{total_cost}}</li>
<li><strong>Booking ID:</strong> {{booking_id}}</li>
</ul>
<p>We look forward to providing you with excellent cleaning service!</p>
<p>Best regards,<br>SN Cleaning Services</p>', 
'Sent when a new booking is created', true),

('booking_status_update', 'Booking Status Update - {{new_status}}', 
'<h2>Booking Status Update</h2>
<p>Dear {{customer_name}},</p>
<p>Your booking status has been updated:</p>
<ul>
<li><strong>Booking ID:</strong> {{booking_id}}</li>
<li><strong>Date:</strong> {{booking_date}} at {{booking_time}}</li>
<li><strong>Address:</strong> {{booking_address}}</li>
<li><strong>Previous Status:</strong> {{old_status}}</li>
<li><strong>New Status:</strong> {{new_status}}</li>
</ul>
<p>If you have any questions, please contact us.</p>
<p>Best regards,<br>SN Cleaning Services</p>', 
'Sent when booking status changes', true),

('booking_completion', 'Cleaning Completed - Thank You!', 
'<h2>Cleaning Service Completed</h2>
<p>Dear {{customer_name}},</p>
<p>Your cleaning service has been completed successfully!</p>
<ul>
<li><strong>Date:</strong> {{booking_date}} at {{booking_time}}</li>
<li><strong>Address:</strong> {{booking_address}}</li>
<li><strong>Total Cost:</strong> £{{total_cost}}</li>
<li><strong>Booking ID:</strong> {{booking_id}}</li>
</ul>
<p>We hope you are satisfied with our service. Thank you for choosing SN Cleaning Services!</p>
<p>Best regards,<br>SN Cleaning Services</p>', 
'Sent when booking is marked as completed', true),

('payment_reminder', 'Payment Reminder - {{booking_date}}', 
'<h2>Payment Reminder</h2>
<p>Dear {{customer_name}},</p>
<p>This is a reminder about your payment for the cleaning service:</p>
<ul>
<li><strong>Booking ID:</strong> {{booking_id}}</li>
<li><strong>Date:</strong> {{booking_date}}</li>
<li><strong>Address:</strong> {{booking_address}}</li>
<li><strong>Amount Due:</strong> £{{total_cost}}</li>
<li><strong>Payment Status:</strong> {{payment_status}}</li>
</ul>
<p>Please contact us to arrange payment or resolve any issues.</p>
<p>Best regards,<br>SN Cleaning Services</p>', 
'Sent for overdue or failed payments', true);

-- Create notification triggers for the default templates
INSERT INTO notification_triggers (template_name, event_type, description, is_active) VALUES
('booking_confirmation', 'booking_created', 'Send confirmation email when new booking is created', true),
('booking_status_update', 'booking_status_changed', 'Send email when booking status changes', true),
('booking_completion', 'booking_completed', 'Send email when booking is completed', true),
('payment_reminder', 'payment_overdue', 'Send reminder for overdue payments', true);