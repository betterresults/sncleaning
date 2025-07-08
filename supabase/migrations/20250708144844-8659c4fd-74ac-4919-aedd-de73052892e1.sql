-- Make cleaning photos publicly accessible
CREATE POLICY "Allow public access to cleaning photos"
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'cleaning.photos');

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cleaning.photos';