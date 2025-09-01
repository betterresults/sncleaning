-- Drop the existing customer-only policy
DROP POLICY IF EXISTS "Customers can view photos for their bookings" ON storage.objects;

-- Create a public policy that allows anyone to view cleaning photos
CREATE POLICY "Public can view all cleaning photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cleaning.photos');