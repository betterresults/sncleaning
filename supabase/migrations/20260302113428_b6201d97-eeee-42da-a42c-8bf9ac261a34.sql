-- Create a public bucket for landing page assets (videos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-assets', 'landing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view files in the bucket
CREATE POLICY "Public can view landing assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-assets');
