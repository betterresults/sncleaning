-- Update RLS policies for addresses to allow admins to view all addresses
DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;

-- Create new policies that allow both customers and admins
CREATE POLICY "Customers can view their own addresses OR admins can view all" 
ON addresses FOR SELECT 
USING (
  customer_id IN (
    SELECT profiles.customer_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Customers can insert their own addresses OR admins can insert any" 
ON addresses FOR INSERT 
WITH CHECK (
  customer_id IN (
    SELECT profiles.customer_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Customers can update their own addresses OR admins can update any" 
ON addresses FOR UPDATE 
USING (
  customer_id IN (
    SELECT profiles.customer_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Customers can delete their own addresses OR admins can delete any" 
ON addresses FOR DELETE 
USING (
  customer_id IN (
    SELECT profiles.customer_id
    FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  )
);