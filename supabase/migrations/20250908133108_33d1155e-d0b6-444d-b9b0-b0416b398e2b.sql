-- Insert SMS templates for payment collection and account login

INSERT INTO public.sms_templates (name, content, variables, is_active) VALUES 
(
  'Payment Card Collection',
  'Hi {{customer_name}}! To make future bookings easier, please add your payment card to your account: {{payment_link}}. This will speed up your next booking process. - SN Cleaning Services',
  '["customer_name", "payment_link"]',
  true
),
(
  'Account Login Information', 
  'Welcome {{customer_name}}! You now have an account on our website where you can view all your bookings and manage services. Login here: {{login_link}} with your email and temporary password: {{temp_password}} - SN Cleaning Services',
  '["customer_name", "login_link", "temp_password"]',
  true
);