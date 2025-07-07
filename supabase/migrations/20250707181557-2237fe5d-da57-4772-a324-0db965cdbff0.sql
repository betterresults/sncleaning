-- Create storage policies for cleaning.photos bucket

-- Allow cleaners to view their own uploaded photos
CREATE POLICY "Cleaners can view their own cleaning photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cleaning.photos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.cleaner_id IS NOT NULL
  )
);

-- Allow cleaners to upload photos for their bookings
CREATE POLICY "Cleaners can upload cleaning photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cleaning.photos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.cleaner_id IS NOT NULL
  )
);

-- Allow cleaners to update their own uploaded photos
CREATE POLICY "Cleaners can update their own cleaning photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'cleaning.photos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.cleaner_id IS NOT NULL
  )
);

-- Allow admins to manage all cleaning photos
CREATE POLICY "Admins can manage all cleaning photos" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'cleaning.photos' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Allow customers to view photos for their bookings (optional, for when they want to see the cleaning photos)
CREATE POLICY "Customers can view photos for their bookings" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cleaning.photos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.customer_id IS NOT NULL
  )
);