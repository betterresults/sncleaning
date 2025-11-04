-- Add columns for icon customization
ALTER TABLE public.airbnb_field_configs 
ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS icon_size INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS icon_storage_path TEXT;

-- Create storage bucket for form icons
INSERT INTO storage.buckets (id, name, public) 
VALUES ('form-icons', 'form-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for form icons
CREATE POLICY "Anyone can view form icons"
ON storage.objects FOR SELECT
USING (bucket_id = 'form-icons');

CREATE POLICY "Authenticated users can upload form icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'form-icons' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update form icons"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'form-icons' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete form icons"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'form-icons' 
  AND auth.role() = 'authenticated'
);