-- 1) Drop existing value_type CHECK constraint first (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'airbnb_field_configs_value_type_check'
      AND conrelid = 'public.airbnb_field_configs'::regclass
  ) THEN
    ALTER TABLE public.airbnb_field_configs
      DROP CONSTRAINT airbnb_field_configs_value_type_check;
  END IF;
END $$;

-- 2) Add min_value column if not exists
ALTER TABLE public.airbnb_field_configs
  ADD COLUMN IF NOT EXISTS min_value numeric NULL;

-- 3) Normalize existing value_type values to the allowed set
UPDATE public.airbnb_field_configs
SET value_type = 'none'
WHERE value_type NOT IN ('fixed', 'percentage', 'none');

-- 4) Recreate CHECK constraint to allow the three values
ALTER TABLE public.airbnb_field_configs
  ADD CONSTRAINT airbnb_field_configs_value_type_check
  CHECK (value_type IN ('fixed', 'percentage', 'none'));
