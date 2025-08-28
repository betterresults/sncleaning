-- Fix cleaner photo upload permissions

-- Drop the existing INSERT policy that might be too restrictive
DROP POLICY IF EXISTS "Cleaners and admins can upload photos" ON public.cleaning_photos;

-- Create a more specific policy for cleaner photo uploads
CREATE POLICY "Cleaners can upload photos for their bookings"
ON public.cleaning_photos
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin users can upload any photos
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  -- Cleaners can only upload photos for bookings they are assigned to
  (
    cleaner_id IN (
      SELECT c.id 
      FROM cleaners c
      JOIN profiles p ON p.cleaner_id = c.id
      WHERE p.user_id = auth.uid()
    )
    AND
    booking_id IN (
      SELECT b.id 
      FROM bookings b
      WHERE b.cleaner = cleaner_id
      
      UNION
      
      SELECT pb.id 
      FROM past_bookings pb
      WHERE pb.cleaner = cleaner_id
    )
  )
);