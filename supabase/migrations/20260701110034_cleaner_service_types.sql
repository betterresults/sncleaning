-- Create cleaner_service_types table (structured record of which company_settings
-- service_type keys a cleaner is qualified/willing to perform).
-- Absence of any rows for a cleaner means "no restriction configured" — treated as
-- offering every service until an admin explicitly curates their capabilities.
CREATE TABLE public.cleaner_service_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  service_type_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (cleaner_id, service_type_key)
);

CREATE INDEX idx_cleaner_service_types_cleaner ON public.cleaner_service_types(cleaner_id);

ALTER TABLE public.cleaner_service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cleaners can view their own service types" ON public.cleaner_service_types
  FOR SELECT USING (cleaner_id IN (
    SELECT profiles.cleaner_id FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  ));

CREATE POLICY "Cleaners can manage their own service types" ON public.cleaner_service_types
  FOR ALL USING (cleaner_id IN (
    SELECT profiles.cleaner_id FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  ));

CREATE POLICY "Admins can manage all cleaner service types" ON public.cleaner_service_types
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE POLICY "Sales agents can manage all cleaner service types" ON public.cleaner_service_types
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'sales_agent'
  ));
