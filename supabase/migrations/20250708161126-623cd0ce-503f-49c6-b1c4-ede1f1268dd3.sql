-- Drop the existing cleaner upload policy
DROP POLICY IF EXISTS "Cleaners can upload photos for their bookings" ON public.cleaning_photos;

-- Create a new policy that allows both cleaners and admins to upload photos
CREATE POLICY "Cleaners and admins can upload photos" 
ON public.cleaning_photos 
FOR INSERT 
WITH CHECK (
  -- Allow if user is admin
  (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
  OR
  -- Allow if user is the cleaner for this booking
  (cleaner_id IN (
    SELECT c.id
    FROM public.cleaners c
    JOIN public.profiles p ON p.cleaner_id = c.id
    WHERE p.user_id = auth.uid()
  ))
);