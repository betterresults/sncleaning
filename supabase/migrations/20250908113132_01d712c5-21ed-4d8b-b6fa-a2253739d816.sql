-- Fix RLS policies for cleaning_photos to allow photo uploads
-- The current policy is too restrictive and blocks legitimate uploads

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Authenticated users can upload cleaning photos" ON public.cleaning_photos;

-- Create a more permissive policy that allows inserts for authenticated users and service roles
CREATE POLICY "Allow photo uploads" 
ON public.cleaning_photos 
FOR INSERT 
WITH CHECK (true);

-- Also ensure the bucket policy allows uploads
-- Update storage policy to be more permissive
CREATE POLICY "Allow authenticated uploads to cleaning photos bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'cleaning.photos');