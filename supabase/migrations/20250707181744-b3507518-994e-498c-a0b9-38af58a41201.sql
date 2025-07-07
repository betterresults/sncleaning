-- Drop existing policies and create simpler, more permissive ones
DROP POLICY IF EXISTS "Cleaners can view their own cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Cleaners can upload cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Cleaners can update their own cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Customers can view photos for their bookings" ON storage.objects;

-- Allow authenticated users to upload to cleaning.photos bucket
CREATE POLICY "Allow authenticated upload to cleaning photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cleaning.photos' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to view cleaning photos
CREATE POLICY "Allow authenticated view of cleaning photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update cleaning photos
CREATE POLICY "Allow authenticated update of cleaning photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete cleaning photos (for admins)
CREATE POLICY "Allow authenticated delete of cleaning photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.role() = 'authenticated'
);