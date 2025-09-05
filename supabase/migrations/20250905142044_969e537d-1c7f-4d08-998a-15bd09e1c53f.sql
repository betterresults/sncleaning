-- Fix the ambiguous booking_id reference in send_booking_notification function
CREATE OR REPLACE FUNCTION public.send_booking_notification(booking_id bigint, event_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  booking_record RECORD;
  customer_record RECORD;
  trigger_record RECORD;
  template_record RECORD;
  notification_variables JSONB;
  recipient_email TEXT;
  recipient_type TEXT;
BEGIN
  -- Get booking details with customer and cleaner info
  SELECT 
    b.id,
    b.date_time::date as service_date,
    b.time_only as service_time,
    b.address,
    b.total_cost,
    b.service_type,
    b.customer,
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

  IF NOT FOUND THEN
    RAISE WARNING 'No active template found for trigger: %', trigger_record.id;
    RETURN;
  END IF;

  -- Prepare notification variables with better service type formatting
  notification_variables := jsonb_build_object(
    'customer_name', COALESCE(customer_record.full_name, 'Valued Customer'),
    'booking_date', TO_CHAR(booking_record.service_date, 'Day, DD Month YYYY'),
    'booking_time', COALESCE(booking_record.service_time::text, 'TBC'),
    'service_type', CASE 
      WHEN booking_record.service_type = 'Domestic' THEN 'Domestic Cleaning'
      WHEN booking_record.service_type = 'Air BnB' THEN 'Airbnb Cleaning'
      WHEN booking_record.service_type = 'Standard Cleaning' THEN 'Standard Cleaning'
      ELSE COALESCE(booking_record.service_type, 'Cleaning Service')
    END,
    'address', COALESCE(booking_record.address, 'Address not specified'),
    'cleaner_name', COALESCE(booking_record.cleaner_name, 'To be assigned'),
    'total_cost', COALESCE(booking_record.total_cost::TEXT, '0')
  );

  -- Send notifications to each recipient type
  FOREACH recipient_type IN ARRAY trigger_record.recipient_types
  LOOP
    IF recipient_type = 'customer' AND customer_record.email IS NOT NULL THEN
      recipient_email := customer_record.email;
    ELSIF recipient_type = 'admin' THEN
      recipient_email := 'sales@sncleaningservices.co.uk';
    ELSE
      CONTINUE; -- Skip if no valid recipient
    END IF;

    -- Call the send-notification-email edge function
    PERFORM
      net.http_post(
        url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/send-notification-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'anon_key'
        ),
        body := jsonb_build_object(
          'template_id', template_record.id,
          'recipient_email', recipient_email,
          'variables', notification_variables
        )
      );

    -- Log the notification
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
      sent_at
    ) VALUES (
      trigger_record.id,
      template_record.id,
      recipient_email,
      recipient_type,
      'Booking notification sent',
      'Notification sent via edge function',
      'booking',
      booking_id,
      'sent',
      NOW()
    );

  END LOOP;

END;
$function$;