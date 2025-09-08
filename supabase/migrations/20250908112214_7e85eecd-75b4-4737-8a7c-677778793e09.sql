-- Remove all existing policies for cleaning photos bucket more thoroughly
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    -- Drop all policies for storage.objects that involve cleaning.photos bucket
    FOR policy_rec IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND definition LIKE '%cleaning.photos%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename);
    END LOOP;
END
$$;

-- Make the bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cleaning.photos';

-- Create completely public policies for all operations
CREATE POLICY "Public can view all cleaning photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can upload cleaning photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can update cleaning photos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'cleaning.photos')
WITH CHECK (bucket_id = 'cleaning.photos');

CREATE POLICY "Public can delete cleaning photos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'cleaning.photos');