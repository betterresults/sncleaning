-- Add profile_photo column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.profile_photo IS 'URL to the user profile photo stored in Supabase Storage';

-- Create storage bucket for profile photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
CREATE POLICY "Authenticated users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Profile photos are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');