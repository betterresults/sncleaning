-- Create storage bucket for job application CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('job-applications', 'job-applications', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to job-applications bucket
CREATE POLICY "Allow public uploads to job-applications"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-applications');

-- Allow public read access to job-applications bucket
CREATE POLICY "Allow public read access to job-applications"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-applications');

-- Allow admins to delete from job-applications bucket
CREATE POLICY "Allow admin delete from job-applications"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'job-applications' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);