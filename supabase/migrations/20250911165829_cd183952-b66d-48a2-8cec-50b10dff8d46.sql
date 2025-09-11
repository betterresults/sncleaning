-- Remove existing policies for cleaning_photos table
DROP POLICY IF EXISTS "Public can delete cleaning photos" ON public.cleaning_photos;
DROP POLICY IF EXISTS "Public can insert cleaning photos" ON public.cleaning_photos;
DROP POLICY IF EXISTS "Public can update cleaning photos" ON public.cleaning_photos;
DROP POLICY IF EXISTS "Public can view cleaning photos" ON public.cleaning_photos;

-- Create proper RLS policies for cleaning_photos table
CREATE POLICY "Cleaners can insert their photos" 
ON public.cleaning_photos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('cleaner', 'admin')
  )
);

CREATE POLICY "All users can view cleaning photos" 
ON public.cleaning_photos 
FOR SELECT 
USING (true);

CREATE POLICY "Cleaners and admins can update photos" 
ON public.cleaning_photos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('cleaner', 'admin')
  )
);

CREATE POLICY "Admins can delete photos" 
ON public.cleaning_photos 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);