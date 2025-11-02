-- Remove the is_default column from airbnb_field_configs as we'll use category-level defaults instead
ALTER TABLE airbnb_field_configs DROP COLUMN IF EXISTS is_default;

-- Create a new table for category-level default values
CREATE TABLE IF NOT EXISTS airbnb_category_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  default_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE airbnb_category_defaults ENABLE ROW LEVEL SECURITY;

-- Admins can manage category defaults
CREATE POLICY "Admins can manage category defaults"
  ON airbnb_category_defaults
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Everyone can view category defaults
CREATE POLICY "Everyone can view category defaults"
  ON airbnb_category_defaults
  FOR SELECT
  USING (true);

-- Add comment
COMMENT ON TABLE airbnb_category_defaults IS 'Stores default values for each category when user does not select/fill any option';