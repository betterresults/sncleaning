-- Add category_order column to control the order of categories in the form
ALTER TABLE public.airbnb_field_configs
  ADD COLUMN IF NOT EXISTS category_order integer DEFAULT 0;

-- Set initial category order based on typical form flow
UPDATE public.airbnb_field_configs SET category_order = 1 WHERE category = 'Property Type';
UPDATE public.airbnb_field_configs SET category_order = 2 WHERE category = 'Bedrooms';
UPDATE public.airbnb_field_configs SET category_order = 3 WHERE category = 'Bathrooms';
UPDATE public.airbnb_field_configs SET category_order = 4 WHERE category = 'Additional Rooms';
UPDATE public.airbnb_field_configs SET category_order = 5 WHERE category = 'Service Type';
UPDATE public.airbnb_field_configs SET category_order = 6 WHERE category = 'Property Features';
UPDATE public.airbnb_field_configs SET category_order = 7 WHERE category = 'Property Already Cleaned';
UPDATE public.airbnb_field_configs SET category_order = 8 WHERE category = 'Oven Type';
UPDATE public.airbnb_field_configs SET category_order = 9 WHERE category = 'Oven Cleaning';
UPDATE public.airbnb_field_configs SET category_order = 10 WHERE category = 'Cleaning Products';
UPDATE public.airbnb_field_configs SET category_order = 11 WHERE category = 'Equipment';
UPDATE public.airbnb_field_configs SET category_order = 12 WHERE category = 'Equipment Arrangement';