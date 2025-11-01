-- Create company_settings table
CREATE TABLE company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_category text NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(setting_category, setting_key)
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage all settings
CREATE POLICY "Admins can manage all company settings"
ON company_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Everyone can view active settings
CREATE POLICY "Everyone can view active company settings"
ON company_settings
FOR SELECT
TO authenticated
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial service types
INSERT INTO company_settings (setting_category, setting_key, setting_value, display_order, is_active) VALUES
  ('service_type', 'domestic', '{"label": "Domestic Cleaning", "badge_color": "bg-blue-500/10 text-blue-700 border-blue-200"}', 1, true),
  ('service_type', 'commercial', '{"label": "Commercial Cleaning", "badge_color": "bg-purple-500/10 text-purple-700 border-purple-200"}', 2, true),
  ('service_type', 'airbnb', '{"label": "Airbnb Cleaning", "badge_color": "bg-green-500/10 text-green-700 border-green-200"}', 3, true),
  ('service_type', 'end_of_tenancy', '{"label": "End of Tenancy", "badge_color": "bg-orange-500/10 text-orange-700 border-orange-200"}', 4, true),
  ('service_type', 'deep_cleaning', '{"label": "Deep Cleaning", "badge_color": "bg-indigo-500/10 text-indigo-700 border-indigo-200"}', 5, true);

-- Seed initial cleaning types
INSERT INTO company_settings (setting_category, setting_key, setting_value, display_order, is_active) VALUES
  ('cleaning_type', 'standard_cleaning', '{"label": "Standard Cleaning", "description": "Regular cleaning service"}', 1, true),
  ('cleaning_type', 'deep_cleaning', '{"label": "Deep Cleaning", "description": "Thorough deep cleaning"}', 2, true),
  ('cleaning_type', 'one_off', '{"label": "One-Off Cleaning", "description": "Single cleaning session"}', 3, true),
  ('cleaning_type', 'move_in_out', '{"label": "Move In/Out", "description": "Moving cleaning service"}', 4, true);

-- Seed company info placeholders
INSERT INTO company_settings (setting_category, setting_key, setting_value, display_order, is_active) VALUES
  ('company_info', 'company_name', '{"value": "SN Cleaning Services"}', 1, true),
  ('company_info', 'phone', '{"value": ""}', 2, true),
  ('company_info', 'email', '{"value": "sales@sncleaningservices.co.uk"}', 3, true),
  ('company_info', 'address', '{"value": ""}', 4, true);

-- Normalize existing bookings data to match new keys
UPDATE bookings SET service_type = 'airbnb' 
WHERE service_type IN ('Air BnB', 'Airbnb Cleaning', 'airbnb_cleaning', 'Airbnb');

UPDATE bookings SET service_type = 'domestic' 
WHERE service_type IN ('Domestic', 'Domestic Cleaning', 'domestic_cleaning');

UPDATE bookings SET service_type = 'commercial' 
WHERE service_type IN ('Commercial', 'Commercial Cleaning');

UPDATE bookings SET service_type = 'end_of_tenancy' 
WHERE service_type IN ('End of Tenancy', 'End Of Tenancy', 'end_of_tenancy_cleaning');

UPDATE bookings SET service_type = 'deep_cleaning' 
WHERE service_type IN ('Deep Cleaning', 'Deep Clean');

UPDATE bookings SET cleaning_type = 'standard_cleaning' 
WHERE cleaning_type IN ('Standard Cleaning', 'Standard', 'standard');

UPDATE bookings SET cleaning_type = 'deep_cleaning' 
WHERE cleaning_type IN ('Deep Cleaning', 'Deep Clean', 'deep');

-- Do the same for past_bookings if needed
UPDATE past_bookings SET service_type = 'airbnb' 
WHERE service_type IN ('Air BnB', 'Airbnb Cleaning', 'airbnb_cleaning', 'Airbnb');

UPDATE past_bookings SET service_type = 'domestic' 
WHERE service_type IN ('Domestic', 'Domestic Cleaning', 'domestic_cleaning');

UPDATE past_bookings SET service_type = 'commercial' 
WHERE service_type IN ('Commercial', 'Commercial Cleaning');

UPDATE past_bookings SET service_type = 'end_of_tenancy' 
WHERE service_type IN ('End of Tenancy', 'End Of Tenancy', 'end_of_tenancy_cleaning');

UPDATE past_bookings SET service_type = 'deep_cleaning' 
WHERE service_type IN ('Deep Cleaning', 'Deep Clean');

UPDATE past_bookings SET cleaning_type = 'standard_cleaning' 
WHERE cleaning_type IN ('Standard Cleaning', 'Standard', 'standard');

UPDATE past_bookings SET cleaning_type = 'deep_cleaning' 
WHERE cleaning_type IN ('Deep Cleaning', 'Deep Clean', 'deep');