-- Make photo uploads completely public and unrestricted as requested
-- Drop all restrictive policies for cleaning_photos table

DROP POLICY IF EXISTS "Allow photo uploads" ON public.cleaning_photos;
DROP POLICY IF EXISTS "Admins can manage all cleaning photos" ON public.cleaning_photos;
DROP POLICY IF EXISTS "Cleaners can view photos for their bookings" ON public.cleaning_photos;
DROP POLICY IF EXISTS "Customers can view their booking photos" ON public.cleaning_photos;
DROP POLICY IF EXISTS "Public can view cleaning photos" ON public.cleaning_photos;

-- Create completely open policies - anyone can do anything with photos
CREATE POLICY "Public can insert cleaning photos" 
ON public.cleaning_photos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view cleaning photos" 
ON public.cleaning_photos 
FOR SELECT 
USING (true);

CREATE POLICY "Public can update cleaning photos" 
ON public.cleaning_photos 
FOR UPDATE 
USING (true);

CREATE POLICY "Public can delete cleaning photos" 
ON public.cleaning_photos 
FOR DELETE 
USING (true);

-- Make storage bucket completely public too
DROP POLICY IF EXISTS "Allow authenticated uploads to cleaning photos bucket" ON storage.objects;

CREATE POLICY "Public can upload to cleaning photos bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can view cleaning photos in bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can update cleaning photos in bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can delete cleaning photos in bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'cleaning.photos');