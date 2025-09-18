-- Fix storage RLS policies for cleaning photos
DROP POLICY IF EXISTS "Cleaners can upload cleaning photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view cleaning photos" ON storage.objects;

-- Create proper RLS policies for cleaning photos storage
CREATE POLICY "Cleaners can upload cleaning photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cleaning.photos' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.cleaner_id IS NOT NULL
  )
);

CREATE POLICY "Authenticated users can view cleaning photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Admins and cleaners can delete cleaning photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.uid() IS NOT NULL AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.cleaner_id IS NOT NULL
    )
  )
);