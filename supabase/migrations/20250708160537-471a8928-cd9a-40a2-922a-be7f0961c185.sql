-- Allow public access to view cleaning photos (for email links)
CREATE POLICY "Public can view cleaning photos" 
ON public.cleaning_photos 
FOR SELECT 
USING (true);

-- Also make the storage bucket public accessible for the photos
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cleaning.photos';