-- Make cleaning photos bucket completely public without restrictions
-- Remove all existing policies for cleaning photos
DROP POLICY IF EXISTS "Allow authenticated view of cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update of cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete of cleaning photos" ON storage.objects;

-- Make the bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cleaning.photos';

-- Create completely public policies for all operations
CREATE POLICY "Public can view all cleaning photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can upload cleaning photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can update cleaning photos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'cleaning.photos')
WITH CHECK (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can delete cleaning photos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'cleaning.photos');