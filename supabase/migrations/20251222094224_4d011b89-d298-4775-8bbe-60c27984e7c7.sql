-- Create the unified booking_cleaners table
CREATE TABLE public.booking_cleaners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id),
  
  -- Payment configuration
  payment_type TEXT NOT NULL DEFAULT 'hourly', -- 'hourly', 'percentage', 'fixed'
  hourly_rate NUMERIC,
  hours_assigned NUMERIC,
  percentage_rate NUMERIC,
  fixed_amount NUMERIC,
  
  -- Calculated pay (stored for quick access)
  calculated_pay NUMERIC NOT NULL DEFAULT 0,
  
  -- Tracking
  is_primary BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'assigned',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique cleaner per booking
  UNIQUE(booking_id, cleaner_id)
);

-- Create index for faster lookups
CREATE INDEX idx_booking_cleaners_booking_id ON public.booking_cleaners(booking_id);
CREATE INDEX idx_booking_cleaners_cleaner_id ON public.booking_cleaners(cleaner_id);

-- Enable RLS
ALTER TABLE public.booking_cleaners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all booking_cleaners"
ON public.booking_cleaners FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

CREATE POLICY "Sales agents can manage booking_cleaners"
ON public.booking_cleaners FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'sales_agent'
));

CREATE POLICY "Cleaners can view their own assignments"
ON public.booking_cleaners FOR SELECT
USING (cleaner_id IN (
  SELECT profiles.cleaner_id FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.cleaner_id IS NOT NULL
));

CREATE POLICY "Customers can view cleaners on their bookings"
ON public.booking_cleaners FOR SELECT
USING (booking_id IN (
  SELECT b.id FROM bookings b
  WHERE b.customer IN (
    SELECT profiles.customer_id FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.customer_id IS NOT NULL
  )
));

-- Trigger to update updated_at
CREATE TRIGGER update_booking_cleaners_updated_at
BEFORE UPDATE ON public.booking_cleaners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing primary cleaners from bookings table
INSERT INTO public.booking_cleaners (
  booking_id,
  cleaner_id,
  payment_type,
  hourly_rate,
  hours_assigned,
  percentage_rate,
  calculated_pay,
  is_primary,
  status
)
SELECT 
  b.id as booking_id,
  b.cleaner as cleaner_id,
  CASE 
    WHEN b.cleaner_percentage IS NOT NULL AND b.cleaner_percentage > 0 THEN 'percentage'
    ELSE 'hourly'
  END as payment_type,
  b.cleaner_rate as hourly_rate,
  b.total_hours as hours_assigned,
  b.cleaner_percentage as percentage_rate,
  COALESCE(b.cleaner_pay, 0) as calculated_pay,
  TRUE as is_primary,
  'assigned' as status
FROM public.bookings b
WHERE b.cleaner IS NOT NULL
ON CONFLICT (booking_id, cleaner_id) DO NOTHING;

-- Migrate existing sub_bookings
INSERT INTO public.booking_cleaners (
  booking_id,
  cleaner_id,
  payment_type,
  hourly_rate,
  hours_assigned,
  percentage_rate,
  calculated_pay,
  is_primary,
  status
)
SELECT 
  sb.primary_booking_id as booking_id,
  sb.cleaner_id,
  CASE 
    WHEN sb.payment_method = 'percentage' THEN 'percentage'
    ELSE 'hourly'
  END as payment_type,
  sb.hourly_rate,
  sb.hours_assigned,
  sb.percentage_rate,
  COALESCE(sb.cleaner_pay, 0) as calculated_pay,
  FALSE as is_primary,
  'assigned' as status
FROM public.sub_bookings sb
WHERE sb.cleaner_id IS NOT NULL
ON CONFLICT (booking_id, cleaner_id) DO NOTHING;