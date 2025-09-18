-- Ensure storage bucket exists and set permissive policies for cleaner photo uploads
insert into storage.buckets (id, name, public)
values ('cleaning.photos', 'cleaning.photos', true)
on conflict (id) do nothing;

-- Policies for cleaning.photos bucket
-- Clean up existing conflicting policies (safe to drop if absent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow read from cleaning.photos for all'
  ) THEN
    DROP POLICY "Allow read from cleaning.photos for all" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow upload to cleaning.photos for authenticated'
  ) THEN
    DROP POLICY "Allow upload to cleaning.photos for authenticated" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow update on cleaning.photos for authenticated'
  ) THEN
    DROP POLICY "Allow update on cleaning.photos for authenticated" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow delete on cleaning.photos for authenticated'
  ) THEN
    DROP POLICY "Allow delete on cleaning.photos for authenticated" ON storage.objects;
  END IF;
END $$;

-- Read: anyone can view objects in this public bucket (used for signed URLs and optional public reads)
CREATE POLICY "Allow read from cleaning.photos for all"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cleaning.photos');

-- Insert: any authenticated user (cleaners, admins) can upload into this bucket
CREATE POLICY "Allow upload to cleaning.photos for authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cleaning.photos');

-- Update: allow authenticated users to update their objects in this bucket
CREATE POLICY "Allow update on cleaning.photos for authenticated"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'cleaning.photos')
WITH CHECK (bucket_id = 'cleaning.photos');

-- Delete: allow authenticated users to delete from this bucket (we can tighten later if needed)
CREATE POLICY "Allow delete on cleaning.photos for authenticated"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cleaning.photos');