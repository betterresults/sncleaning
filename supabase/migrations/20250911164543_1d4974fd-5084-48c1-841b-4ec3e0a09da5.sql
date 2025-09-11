-- Remove duplicate storage policies for cleaning.photos bucket
DROP POLICY IF EXISTS "Public can upload to cleaning photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can view cleaning photos in bucket" ON storage.objects;  
DROP POLICY IF EXISTS "Public can update cleaning photos in bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public update cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Public view cleaning photos" ON storage.objects;

-- Create clean, single set of policies for cleaning.photos bucket
CREATE POLICY "Cleaners can upload cleaning photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cleaning.photos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view cleaning photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cleaning.photos');

CREATE POLICY "Cleaners can update cleaning photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Cleaners can delete cleaning photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.uid() IS NOT NULL
);