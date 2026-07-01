-- Create cleaner_working_hours table (weekly recurring availability set by each cleaner)
-- One row per cleaner per day of week. Absence of a row means unavailable that day.
CREATE TABLE public.cleaner_working_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday .. 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (cleaner_id, day_of_week),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_cleaner_working_hours_cleaner ON public.cleaner_working_hours(cleaner_id);

ALTER TABLE public.cleaner_working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cleaners can view their own working hours" ON public.cleaner_working_hours
  FOR SELECT USING (cleaner_id IN (
    SELECT profiles.cleaner_id FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  ));

CREATE POLICY "Cleaners can manage their own working hours" ON public.cleaner_working_hours
  FOR ALL USING (cleaner_id IN (
    SELECT profiles.cleaner_id FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  ));

CREATE POLICY "Admins can manage all cleaner working hours" ON public.cleaner_working_hours
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

CREATE TRIGGER update_cleaner_working_hours_updated_at
  BEFORE UPDATE ON public.cleaner_working_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
