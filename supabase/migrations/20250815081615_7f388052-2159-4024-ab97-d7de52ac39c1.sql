-- Create cleaner_recurring_rates table to store custom rates per cleaner and recurring booking
CREATE TABLE public.cleaner_recurring_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cleaner_id BIGINT NOT NULL,
  recurring_group_id UUID NOT NULL,
  custom_hourly_rate NUMERIC,
  custom_percentage_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cleaner_id, recurring_group_id)
);

-- Enable Row Level Security
ALTER TABLE public.cleaner_recurring_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for cleaner_recurring_rates
CREATE POLICY "Admins can manage all cleaner recurring rates"
ON public.cleaner_recurring_rates
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Authenticated users can view cleaner recurring rates"
ON public.cleaner_recurring_rates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cleaner_recurring_rates_updated_at
BEFORE UPDATE ON public.cleaner_recurring_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();