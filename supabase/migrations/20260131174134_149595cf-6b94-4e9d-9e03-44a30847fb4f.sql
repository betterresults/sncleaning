-- Update send_booking_notification to NOT log the email notification
-- since the edge function already logs it with better details (actual subject from Resend)
-- Instead, pass the trigger_id to the edge function so it can include it in the log

CREATE OR REPLACE FUNCTION public.send_booking_notification(booking_id bigint, event_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  booking_record RECORD;
  customer_record RECORD;
  trigger_record RECORD;
  template_record RECORD;
  sms_template_record RECORD;
  notification_variables JSONB;
  recipient_email TEXT;
  recipient_type TEXT;
  recipient_phone TEXT;
  auth_header TEXT;
  sms_content TEXT;
BEGIN
  -- Get booking details with customer and cleaner info (now includes postcode)
  SELECT 
    b.id,
    b.date_time::date as service_date,
    b.time_only as service_time,
    b.address,
    b.postcode,
    b.total_cost,
    b.service_type,
    b.customer,
    b.phone_number,
    COALESCE(c.first_name || ' ' || c.last_name, c.first_name, 'Not assigned') as cleaner_name
  FROM bookings b
  LEFT JOIN cleaners c ON b.cleaner = c.id
  WHERE b.id = send_booking_notification.booking_id
  INTO booking_record;

  IF NOT FOUND THEN
    RAISE WARNING 'Booking not found: %', booking_id;
    RETURN;
  END IF;

  -- Get customer details
  SELECT 
    email,
    phone,
    COALESCE(first_name || ' ' || last_name, first_name, email) as full_name
  FROM customers 
  WHERE id = booking_record.customer
  INTO customer_record;

  -- Get notification trigger
  SELECT * FROM notification_triggers 
  WHERE trigger_event = event_type AND is_enabled = true
  INTO trigger_record;

  IF NOT FOUND THEN
    RAISE WARNING 'No enabled trigger found for event: %', event_type;
    RETURN;
  END IF;

  -- Get email template
  SELECT * FROM email_notification_templates 
  WHERE id = trigger_record.template_id AND is_active = true
  INTO template_record;

  -- Get SMS template if configured
  IF trigger_record.sms_template_id IS NOT NULL THEN
    SELECT * FROM sms_templates 
    WHERE id = trigger_record.sms_template_id AND is_active = true
    INTO sms_template_record;
  END IF;

  -- Prepare notification variables with booking_id and postcode included
  -- IMPORTANT: Use COALESCE for TO_CHAR to prevent NULL from propagating
  notification_variables := jsonb_build_object(
    'booking_id', booking_id::TEXT,
    'customer_name', COALESCE(customer_record.full_name, 'Valued Customer'),
    'booking_date', COALESCE(TO_CHAR(booking_record.service_date, 'Day, DD Month YYYY'), 'TBC'),
    'booking_time', COALESCE(booking_record.service_time::text, 'TBC'),
    'service_type', CASE 
      WHEN booking_record.service_type = 'Domestic' THEN 'Domestic Cleaning'
      WHEN booking_record.service_type = 'Air BnB' THEN 'Airbnb Cleaning'
      WHEN booking_record.service_type = 'Standard Cleaning' THEN 'Standard Cleaning'
      ELSE COALESCE(booking_record.service_type, 'Cleaning Service')
    END,
    'address', COALESCE(booking_record.address, 'Address not specified'),
    'postcode', COALESCE(booking_record.postcode, ''),
    'cleaner_name', COALESCE(booking_record.cleaner_name, 'To be assigned'),
    'total_cost', COALESCE(booking_record.total_cost::TEXT, '0')
  );

  -- Prepare authorization header safely
  auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4';

  -- Send notifications to each recipient type
  FOREACH recipient_type IN ARRAY trigger_record.recipient_types
  LOOP
    IF recipient_type = 'customer' AND customer_record.email IS NOT NULL THEN
      recipient_email := customer_record.email;
      recipient_phone := COALESCE(customer_record.phone, booking_record.phone_number);
    ELSIF recipient_type = 'admin' THEN
      recipient_email := 'sales@sncleaningservices.co.uk';
      recipient_phone := NULL; -- Don't send SMS to admin
    ELSE
      CONTINUE; -- Skip if no valid recipient
    END IF;

    -- Send email if channel is email or both, and template exists
    IF (trigger_record.notification_channel IS NULL OR trigger_record.notification_channel = 'email' OR trigger_record.notification_channel = 'both') 
       AND template_record.id IS NOT NULL THEN
      -- Call the send-notification-email edge function
      -- Pass trigger_id, entity info so the edge function can log with full context
      PERFORM
        net.http_post(
          url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-notification-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', auth_header
          ),
          body := jsonb_build_object(
            'template_id', template_record.id,
            'recipient_email', recipient_email,
            'recipient_type', recipient_type,
            'variables', notification_variables,
            'trigger_id', trigger_record.id,
            'entity_type', 'booking',
            'entity_id', booking_id::TEXT
          )
        );
      -- NOTE: We no longer log here - the edge function handles logging with proper details
    END IF;

    -- Send SMS if channel is sms or both, SMS template exists, and phone number is available
    IF (trigger_record.notification_channel = 'sms' OR trigger_record.notification_channel = 'both') 
       AND sms_template_record.id IS NOT NULL 
       AND recipient_phone IS NOT NULL THEN
      
      -- Replace variables in SMS content (now includes postcode)
      -- IMPORTANT: Use COALESCE for TO_CHAR to prevent NULL from wiping entire string
      sms_content := sms_template_record.content;
      sms_content := REPLACE(sms_content, '{{booking_id}}', booking_id::TEXT);
      sms_content := REPLACE(sms_content, '{{customer_name}}', COALESCE(customer_record.full_name, 'Valued Customer'));
      sms_content := REPLACE(sms_content, '{{booking_date}}', COALESCE(TO_CHAR(booking_record.service_date, 'Day, DD Month YYYY'), 'TBC'));
      sms_content := REPLACE(sms_content, '{{booking_time}}', COALESCE(booking_record.service_time::text, 'TBC'));
      sms_content := REPLACE(sms_content, '{{address}}', COALESCE(booking_record.address, 'Address not specified'));
      sms_content := REPLACE(sms_content, '{{postcode}}', COALESCE(booking_record.postcode, ''));
      sms_content := REPLACE(sms_content, '{{total_cost}}', COALESCE(booking_record.total_cost::TEXT, '0'));
      sms_content := REPLACE(sms_content, '{{cleaner_name}}', COALESCE(booking_record.cleaner_name, 'To be assigned'));

      -- Call the send-sms-notification edge function
      PERFORM
        net.http_post(
          url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-sms-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', auth_header
          ),
          body := jsonb_build_object(
            'to', recipient_phone,
            'message', sms_content
          )
        );

      -- Log the SMS notification (SMS edge function doesn't log, so we do it here)
      INSERT INTO notification_logs (
        trigger_id,
        template_id,
        recipient_email,
        recipient_type,
        subject,
        content,
        entity_type,
        entity_id,
        status,
        sent_at,
        notification_type
      ) VALUES (
        trigger_record.id,
        NULL,
        recipient_phone,
        recipient_type,
        'SMS notification sent',
        sms_content,
        'booking',
        booking_id,
        'sent',
        NOW(),
        'sms'
      );
    END IF;

  END LOOP;

END;
$function$;