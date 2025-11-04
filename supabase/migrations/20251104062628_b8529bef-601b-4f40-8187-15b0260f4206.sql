-- Create scheduling_rules table for dynamic time slots and pricing
CREATE TABLE public.scheduling_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('day_pricing', 'time_slot', 'cutoff_time', 'overtime_window', 'time_surcharge')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  price_modifier NUMERIC DEFAULT 0,
  modifier_type TEXT CHECK (modifier_type IN ('fixed', 'percentage')),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  label TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduling_rules ENABLE ROW LEVEL SECURITY;

-- Admins can manage all scheduling rules
CREATE POLICY "Admins can manage all scheduling rules"
ON public.scheduling_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Everyone can view active scheduling rules
CREATE POLICY "Everyone can view active scheduling rules"
ON public.scheduling_rules
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_scheduling_rules_updated_at
BEFORE UPDATE ON public.scheduling_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Populate initial data with current hardcoded values
-- Time slots (7:00 AM to 4:00 PM in 1-hour intervals)
INSERT INTO public.scheduling_rules (rule_type, start_time, end_time, is_active, display_order, label)
VALUES 
  ('time_slot', '07:00', '08:00', true, 1, '7:00 AM'),
  ('time_slot', '08:00', '09:00', true, 2, '8:00 AM'),
  ('time_slot', '09:00', '10:00', true, 3, '9:00 AM'),
  ('time_slot', '10:00', '11:00', true, 4, '10:00 AM'),
  ('time_slot', '11:00', '12:00', true, 5, '11:00 AM'),
  ('time_slot', '12:00', '13:00', true, 6, '12:00 PM'),
  ('time_slot', '13:00', '14:00', true, 7, '1:00 PM'),
  ('time_slot', '14:00', '15:00', true, 8, '2:00 PM'),
  ('time_slot', '15:00', '16:00', true, 9, '3:00 PM'),
  ('time_slot', '16:00', '17:00', true, 10, '4:00 PM');

-- Standard cutoff time (6:00 PM finish)
INSERT INTO public.scheduling_rules (rule_type, end_time, price_modifier, modifier_type, label, description, display_order)
VALUES ('cutoff_time', '18:00', 0, 'fixed', 'Standard Hours End', 'Latest finish time without overtime', 1);

-- Create index for performance
CREATE INDEX idx_scheduling_rules_type_active ON public.scheduling_rules(rule_type, is_active);
CREATE INDEX idx_scheduling_rules_day ON public.scheduling_rules(day_of_week) WHERE day_of_week IS NOT NULL;