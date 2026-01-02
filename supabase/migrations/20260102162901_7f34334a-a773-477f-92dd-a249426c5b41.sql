-- Create email template for booking cancellation
INSERT INTO public.email_notification_templates (name, subject, html_content, text_content, description, variables, is_active)
VALUES (
  'booking_cancelled',
  'Your Booking Has Been Cancelled - SN Cleaning Services',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Cancelled</h1>
    </div>
    <div class="content">
      <p>Dear {{customer_name}},</p>
      <p>We regret to inform you that your booking has been cancelled.</p>
      <div class="details">
        <p><strong>Booking ID:</strong> #{{booking_id}}</p>
        <p><strong>Service:</strong> {{service_type}}</p>
        <p><strong>Date:</strong> {{booking_date}}</p>
        <p><strong>Time:</strong> {{booking_time}}</p>
        <p><strong>Address:</strong> {{address}}, {{postcode}}</p>
      </div>
      <p>If you did not request this cancellation or have any questions, please contact us immediately.</p>
      <p>We hope to serve you again in the future.</p>
      <p>Best regards,<br>SN Cleaning Services Team</p>
    </div>
    <div class="footer">
      <p>SN Cleaning Services | sales@sncleaningservices.co.uk</p>
    </div>
  </div>
</body>
</html>',
  'Dear {{customer_name}},

Your booking has been cancelled.

Booking ID: #{{booking_id}}
Service: {{service_type}}
Date: {{booking_date}}
Time: {{booking_time}}
Address: {{address}}, {{postcode}}

If you did not request this cancellation or have any questions, please contact us.

Best regards,
SN Cleaning Services Team',
  'Email sent to customers when their booking is cancelled',
  '["customer_name", "booking_id", "service_type", "booking_date", "booking_time", "address", "postcode"]',
  true
);

-- Create SMS template for booking cancellation
INSERT INTO public.sms_templates (name, content, description, variables, is_active)
VALUES (
  'booking_cancelled',
  'SN Cleaning: Your booking #{{booking_id}} for {{booking_date}} at {{address}} has been cancelled. Questions? Call us or reply to this message.',
  'SMS sent to customers when their booking is cancelled',
  '["booking_id", "booking_date", "address"]',
  true
);

-- Create notification trigger for booking cancellation
INSERT INTO public.notification_triggers (name, trigger_event, recipient_types, notification_channel, is_enabled)
SELECT 
  'Booking Cancellation Notification',
  'booking_cancelled',
  ARRAY['customer', 'admin'],
  'both',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.notification_triggers WHERE trigger_event = 'booking_cancelled'
);

-- Update the trigger to link to the templates
UPDATE public.notification_triggers 
SET 
  template_id = (SELECT id FROM public.email_notification_templates WHERE name = 'booking_cancelled' LIMIT 1),
  sms_template_id = (SELECT id FROM public.sms_templates WHERE name = 'booking_cancelled' LIMIT 1)
WHERE trigger_event = 'booking_cancelled';

-- Create trigger function to send cancellation notification
CREATE OR REPLACE FUNCTION public.notify_booking_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when status changes to cancelled
  IF NEW.booking_status = 'cancelled' AND (OLD.booking_status IS NULL OR OLD.booking_status != 'cancelled') THEN
    -- Send booking cancelled notification
    PERFORM send_booking_notification(NEW.id, 'booking_cancelled');
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger on bookings table
DROP TRIGGER IF EXISTS trigger_booking_cancelled ON public.bookings;
CREATE TRIGGER trigger_booking_cancelled
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_booking_cancelled();