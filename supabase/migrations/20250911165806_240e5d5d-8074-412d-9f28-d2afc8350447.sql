-- Add RLS policies for cleaning_photos table to allow cleaners to upload photos
CREATE POLICY IF NOT EXISTS "Cleaners can insert their own photos" 
ON public.cleaning_photos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('cleaner', 'admin')
  )
);

CREATE POLICY IF NOT EXISTS "Users can view all cleaning photos" 
ON public.cleaning_photos 
FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Cleaners can update their own photos" 
ON public.cleaning_photos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('cleaner', 'admin')
  )
);

CREATE POLICY IF NOT EXISTS "Admins can delete photos" 
ON public.cleaning_photos 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);