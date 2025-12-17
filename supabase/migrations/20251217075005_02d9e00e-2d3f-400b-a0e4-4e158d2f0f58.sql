-- Add columns to track booking creation
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_source text DEFAULT 'website';

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_bookings_created_by_user_id ON public.bookings(created_by_user_id);

-- Update RLS policy for sales agents to only see their own bookings
DROP POLICY IF EXISTS "Allow authenticated users to view bookings" ON public.bookings;

CREATE POLICY "Admins and customers can view all bookings, sales agents see their own"
ON public.bookings
FOR SELECT
USING (
  -- Admins can see all
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR
  -- Sales agents can only see bookings they created
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'sales_agent'
    )
    AND created_by_user_id = auth.uid()
  )
  OR
  -- Customers can see their own bookings
  customer IN (
    SELECT profiles.customer_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.customer_id IS NOT NULL
  )
  OR
  -- Cleaners can see their assigned bookings
  cleaner IN (
    SELECT profiles.cleaner_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.cleaner_id IS NOT NULL
  )
);

-- Also add to past_bookings for consistency
ALTER TABLE public.past_bookings 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
ADD COLUMN IF NOT EXISTS created_by_source text DEFAULT 'website';

CREATE INDEX IF NOT EXISTS idx_past_bookings_created_by_user_id ON public.past_bookings(created_by_user_id);