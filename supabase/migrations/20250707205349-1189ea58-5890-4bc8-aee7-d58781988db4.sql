-- Create cleaner_tracking table for event-driven location tracking
CREATE TABLE public.cleaner_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_location TEXT, -- Format: "lat,lng"
  check_out_location TEXT, -- Format: "lat,lng"
  is_auto_checked_in BOOLEAN DEFAULT false,
  is_auto_checked_out BOOLEAN DEFAULT false,
  work_duration INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cleaner_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for cleaner_tracking
CREATE POLICY "Cleaners can view their own tracking records"
ON public.cleaner_tracking
FOR SELECT
USING (
  cleaner_id IN (
    SELECT profiles.cleaner_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  )
);

CREATE POLICY "Cleaners can insert their own tracking records"
ON public.cleaner_tracking
FOR INSERT
WITH CHECK (
  cleaner_id IN (
    SELECT profiles.cleaner_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  )
);

CREATE POLICY "Cleaners can update their own tracking records"
ON public.cleaner_tracking
FOR UPDATE
USING (
  cleaner_id IN (
    SELECT profiles.cleaner_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.cleaner_id IS NOT NULL
  )
);

CREATE POLICY "Admins can manage all tracking records"
ON public.cleaner_tracking
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  )
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_cleaner_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for work_duration calculation
CREATE OR REPLACE FUNCTION public.calculate_work_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    NEW.work_duration = NEW.check_out_time - NEW.check_in_time;
  ELSE
    NEW.work_duration = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_cleaner_tracking_updated_at
BEFORE UPDATE ON public.cleaner_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_cleaner_tracking_updated_at();

CREATE TRIGGER calculate_work_duration_trigger
BEFORE INSERT OR UPDATE ON public.cleaner_tracking
FOR EACH ROW
EXECUTE FUNCTION public.calculate_work_duration();

-- Create indexes for performance
CREATE INDEX idx_cleaner_tracking_booking_id ON public.cleaner_tracking(booking_id);
CREATE INDEX idx_cleaner_tracking_cleaner_id ON public.cleaner_tracking(cleaner_id);
CREATE INDEX idx_cleaner_tracking_check_in_time ON public.cleaner_tracking(check_in_time);