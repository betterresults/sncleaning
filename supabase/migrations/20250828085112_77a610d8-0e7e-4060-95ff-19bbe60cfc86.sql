-- Remove the restrictive cleaner policy and allow all authenticated users to upload photos
DROP POLICY IF EXISTS "Cleaners can upload photos for their bookings" ON public.cleaning_photos;

-- Create a simple policy that allows all authenticated users to upload photos
CREATE POLICY "Authenticated users can upload cleaning photos"
ON public.cleaning_photos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);