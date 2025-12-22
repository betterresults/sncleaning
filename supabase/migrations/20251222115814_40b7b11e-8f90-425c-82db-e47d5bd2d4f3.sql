-- Create SMS conversations table to track two-way SMS messages
CREATE TABLE public.sms_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  customer_id bigint REFERENCES public.customers(id),
  customer_name text,
  direction text NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
  message text NOT NULL,
  status text DEFAULT 'sent',
  twilio_sid text,
  booking_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- Create index for faster lookups
CREATE INDEX idx_sms_conversations_phone ON public.sms_conversations(phone_number);
CREATE INDEX idx_sms_conversations_customer ON public.sms_conversations(customer_id);
CREATE INDEX idx_sms_conversations_created ON public.sms_conversations(created_at DESC);

-- Enable RLS
ALTER TABLE public.sms_conversations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all SMS conversations
CREATE POLICY "Admins can manage all SMS conversations"
ON public.sms_conversations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
));

-- Sales agents can view and send SMS
CREATE POLICY "Sales agents can manage SMS conversations"
ON public.sms_conversations
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'sales_agent'::app_role
));

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_conversations;