-- Make the cleaning.photos bucket public so customers can view photos without authentication
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cleaning.photos';

-- Create policies for public access to cleaning photos
CREATE POLICY "Public access to cleaning photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cleaning.photos');

CREATE POLICY "Allow authenticated users to upload cleaning photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'cleaning.photos' AND auth.role() = 'authenticated');