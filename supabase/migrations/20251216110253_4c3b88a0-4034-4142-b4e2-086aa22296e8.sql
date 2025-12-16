-- Sales agent RLS policies

-- Cleaners: sales_agent can view all cleaners (including pay rates)
DROP POLICY IF EXISTS "Sales agents can view all cleaners" ON cleaners;
CREATE POLICY "Sales agents can view all cleaners"
ON cleaners FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));

-- Customers: sales_agent can manage customers
DROP POLICY IF EXISTS "Sales agents can manage customers" ON customers;
CREATE POLICY "Sales agents can manage customers"
ON customers FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));

-- Addresses: sales_agent can manage addresses
DROP POLICY IF EXISTS "Sales agents can manage addresses" ON addresses;
CREATE POLICY "Sales agents can manage addresses"
ON addresses FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));

-- Cleaner recurring rates: sales_agent can view
DROP POLICY IF EXISTS "Sales agents can view cleaner recurring rates" ON cleaner_recurring_rates;
CREATE POLICY "Sales agents can view cleaner recurring rates"
ON cleaner_recurring_rates FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));

-- Quote leads: sales_agent can manage
DROP POLICY IF EXISTS "Sales agents can manage quote leads" ON quote_leads;
CREATE POLICY "Sales agents can manage quote leads"
ON quote_leads FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));

-- Chats: sales_agent can manage all chats
DROP POLICY IF EXISTS "Sales agents can manage all chats" ON chats;
CREATE POLICY "Sales agents can manage all chats"
ON chats FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));

-- Chat messages: sales_agent can manage all messages
DROP POLICY IF EXISTS "Sales agents can manage all messages" ON chat_messages;
CREATE POLICY "Sales agents can manage all messages"
ON chat_messages FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'sales_agent'
));