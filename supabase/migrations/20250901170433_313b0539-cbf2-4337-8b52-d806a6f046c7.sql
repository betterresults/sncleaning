-- Create email notification templates table
CREATE TABLE public.email_notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification triggers table
CREATE TABLE public.notification_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'booking_created', 'booking_completed', 'photos_uploaded', etc.
  template_id UUID REFERENCES public.email_notification_templates(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  timing_offset INTEGER DEFAULT 0, -- minutes before (-) or after (+) the event
  timing_unit TEXT DEFAULT 'minutes', -- 'minutes', 'hours', 'days'
  recipient_types TEXT[] NOT NULL DEFAULT '{}', -- ['customer', 'cleaner', 'admin']
  conditions JSONB DEFAULT '{}'::jsonb, -- conditional logic
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification settings table
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  trigger_id UUID REFERENCES public.notification_triggers(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_timing_offset INTEGER,
  custom_recipients TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification logs table
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id UUID REFERENCES public.notification_triggers(id),
  template_id UUID REFERENCES public.email_notification_templates(id),
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL, -- 'customer', 'cleaner', 'admin'
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  entity_type TEXT, -- 'booking', 'customer', etc.
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered', 'opened'
  delivery_id TEXT, -- external service delivery ID
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification schedules table
CREATE TABLE public.notification_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id UUID REFERENCES public.notification_triggers(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'sent', 'cancelled', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins
CREATE POLICY "Admins can manage email templates" 
ON public.email_notification_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Admins can manage notification triggers" 
ON public.notification_triggers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Admins can manage notification settings" 
ON public.notification_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Admins can view notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Admins can manage notification schedules" 
ON public.notification_schedules 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create indexes for performance
CREATE INDEX idx_notification_triggers_event ON public.notification_triggers(trigger_event);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_entity ON public.notification_logs(entity_type, entity_id);
CREATE INDEX idx_notification_schedules_scheduled ON public.notification_schedules(scheduled_for) WHERE status = 'scheduled';

-- Create update triggers
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_triggers_updated_at
  BEFORE UPDATE ON public.notification_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_schedules_updated_at
  BEFORE UPDATE ON public.notification_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_notification_templates (name, subject, html_content, variables, description) VALUES
('booking_created', 'Booking Confirmation - {{booking_date}}', 
'<h1>Booking Confirmed</h1>
<p>Dear {{customer_name}},</p>
<p>Your booking has been confirmed for {{booking_date}} at {{booking_time}}.</p>
<p><strong>Service:</strong> {{service_type}}</p>
<p><strong>Address:</strong> {{address}}</p>
<p><strong>Cleaner:</strong> {{cleaner_name}}</p>
<p><strong>Total Cost:</strong> £{{total_cost}}</p>
<p>Thank you for choosing our services!</p>', 
'["customer_name", "booking_date", "booking_time", "service_type", "address", "cleaner_name", "total_cost"]', 
'Sent when a new booking is created'),

('booking_completed', 'Service Completed - {{booking_date}}', 
'<h1>Service Completed</h1>
<p>Dear {{customer_name}},</p>
<p>Your cleaning service has been completed on {{booking_date}}.</p>
<p>We hope you are satisfied with our service. Please let us know if you have any feedback!</p>
<p>Thank you for choosing us!</p>', 
'["customer_name", "booking_date"]', 
'Sent when a booking is marked as completed'),

('photos_uploaded', 'Cleaning Photos Available - {{booking_date}}', 
'<h1>Your Cleaning Photos Are Ready!</h1>
<p>Dear {{customer_name}},</p>
<p>The photos from your cleaning service on {{booking_date}} are now available.</p>
<p><a href="{{photos_link}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Photos</a></p>
<p>Thank you for choosing our services!</p>', 
'["customer_name", "booking_date", "photos_link"]', 
'Sent when cleaning photos are uploaded'),

('payment_received', 'Payment Confirmation - {{booking_date}}', 
'<h1>Payment Received</h1>
<p>Dear {{customer_name}},</p>
<p>We have received your payment of £{{amount}} for the cleaning service on {{booking_date}}.</p>
<p>Thank you for your prompt payment!</p>', 
'["customer_name", "booking_date", "amount"]', 
'Sent when payment is received'),

('booking_reminder', 'Reminder: Your Cleaning Service Tomorrow', 
'<h1>Service Reminder</h1>
<p>Dear {{customer_name}},</p>
<p>This is a friendly reminder that your cleaning service is scheduled for tomorrow at {{booking_time}}.</p>
<p><strong>Address:</strong> {{address}}</p>
<p><strong>Cleaner:</strong> {{cleaner_name}}</p>
<p>Please ensure someone is available to provide access.</p>', 
'["customer_name", "booking_time", "address", "cleaner_name"]', 
'Sent 1 day before the booking');

-- Insert default notification triggers
INSERT INTO public.notification_triggers (name, trigger_event, template_id, recipient_types, timing_offset) VALUES
('Booking Created Notification', 'booking_created', 
  (SELECT id FROM public.email_notification_templates WHERE name = 'booking_created'), 
  ARRAY['customer'], 0),

('Booking Completed Notification', 'booking_completed', 
  (SELECT id FROM public.email_notification_templates WHERE name = 'booking_completed'), 
  ARRAY['customer'], 0),

('Photos Uploaded Notification', 'photos_uploaded', 
  (SELECT id FROM public.email_notification_templates WHERE name = 'photos_uploaded'), 
  ARRAY['customer'], 0),

('Payment Received Notification', 'payment_received', 
  (SELECT id FROM public.email_notification_templates WHERE name = 'payment_received'), 
  ARRAY['customer'], 0),

('Booking Reminder', 'booking_reminder', 
  (SELECT id FROM public.email_notification_templates WHERE name = 'booking_reminder'), 
  ARRAY['customer'], -1440); -- 24 hours before