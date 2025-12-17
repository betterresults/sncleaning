-- Add tracking columns to recurring_services
ALTER TABLE public.recurring_services 
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS created_by_source text DEFAULT 'website';

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_recurring_services_created_by_user_id ON public.recurring_services(created_by_user_id);

-- Drop the old permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to view recurring services" ON public.recurring_services;
DROP POLICY IF EXISTS "Allow authenticated users to update recurring services" ON public.recurring_services;

-- Create new SELECT policy for recurring services
CREATE POLICY "View recurring services based on role"
ON public.recurring_services
FOR SELECT
USING (
  -- Admins can see all
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR
  -- Sales agents can only see recurring services they created
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'sales_agent'
    )
    AND created_by_user_id = auth.uid()
  )
  OR
  -- Customers can see their own recurring services
  customer IN (
    SELECT profiles.customer_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.customer_id IS NOT NULL
  )
);

-- Create UPDATE policy
CREATE POLICY "Update recurring services based on role"
ON public.recurring_services
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'sales_agent'
    )
    AND created_by_user_id = auth.uid()
  )
);

-- Create INSERT policy
CREATE POLICY "Insert recurring services"
ON public.recurring_services
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create DELETE policy
CREATE POLICY "Delete recurring services based on role"
ON public.recurring_services
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'sales_agent'
    )
    AND created_by_user_id = auth.uid()
  )
);