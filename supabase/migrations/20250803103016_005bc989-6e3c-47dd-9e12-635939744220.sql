-- Enable RLS on recurring_services table and create policies for admins only
ALTER TABLE public.recurring_services ENABLE ROW LEVEL SECURITY;

-- Create policies for recurring_services table
CREATE POLICY "Admins can manage all recurring services" 
ON public.recurring_services 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));