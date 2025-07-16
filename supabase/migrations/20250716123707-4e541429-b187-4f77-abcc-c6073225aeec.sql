-- Add DELETE policy for bookings table to allow authenticated users to delete bookings
CREATE POLICY "Allow authenticated users to delete bookings" 
ON public.bookings 
FOR DELETE 
USING (true);