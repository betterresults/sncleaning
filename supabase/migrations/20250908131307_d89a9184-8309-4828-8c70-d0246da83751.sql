-- Create SMS templates table
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage SMS templates
CREATE POLICY "Admins can manage SMS templates" 
ON public.sms_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default SMS templates
INSERT INTO public.sms_templates (name, description, content, variables) VALUES
('Booking Confirmation', 'SMS sent when booking is created', 'Hi {{customer_name}}! Your cleaning is confirmed for {{booking_date}} at {{booking_time}}. Address: {{address}}. Thank you for choosing SN Cleaning!', '["customer_name", "booking_date", "booking_time", "address"]'),
('Booking Reminder', 'SMS reminder sent before booking', 'Reminder: Your cleaning appointment is tomorrow {{booking_date}} at {{booking_time}}. Address: {{address}}. SN Cleaning Services.', '["customer_name", "booking_date", "booking_time", "address"]'),
('Cleaner Assignment', 'SMS when cleaner is assigned', 'Hello {{customer_name}}, {{cleaner_name}} has been assigned to your cleaning on {{booking_date}}. Contact us if you have questions!', '["customer_name", "cleaner_name", "booking_date"]'),
('Payment Reminder', 'SMS for payment reminders', 'Hi {{customer_name}}, payment of £{{amount}} for your cleaning service is due. Please make payment at your earliest convenience. Thank you!', '["customer_name", "amount"]'),
('Cleaning Complete', 'SMS when cleaning is finished', 'Your cleaning service at {{address}} has been completed! Photos available at: {{photo_link}}. Thank you for choosing SN Cleaning!', '["customer_name", "address", "photo_link"]');