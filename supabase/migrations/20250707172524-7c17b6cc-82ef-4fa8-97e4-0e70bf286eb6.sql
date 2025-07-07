
-- Create cleaning_photos table to store photo metadata
CREATE TABLE public.cleaning_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id),
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id),
  file_path TEXT NOT NULL, -- Full path in storage bucket
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'damage')),
  caption TEXT, -- Optional description, especially for damage photos
  damage_details TEXT, -- Detailed description for damage photos
  postcode TEXT NOT NULL,
  booking_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_cleaning_photos_booking_id ON public.cleaning_photos(booking_id);
CREATE INDEX idx_cleaning_photos_customer_id ON public.cleaning_photos(customer_id);
CREATE INDEX idx_cleaning_photos_cleaner_id ON public.cleaning_photos(cleaner_id);
CREATE INDEX idx_cleaning_photos_type ON public.cleaning_photos(photo_type);

-- Enable RLS
ALTER TABLE public.cleaning_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Cleaners can insert photos for their assigned bookings
CREATE POLICY "Cleaners can upload photos for their bookings" 
  ON public.cleaning_photos 
  FOR INSERT 
  WITH CHECK (
    cleaner_id IN (
      SELECT id FROM public.cleaners c
      JOIN public.profiles p ON p.cleaner_id = c.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Cleaners can view photos for their assigned bookings
CREATE POLICY "Cleaners can view photos for their bookings" 
  ON public.cleaning_photos 
  FOR SELECT 
  USING (
    cleaner_id IN (
      SELECT id FROM public.cleaners c
      JOIN public.profiles p ON p.cleaner_id = c.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Customers can view photos for their bookings
CREATE POLICY "Customers can view their booking photos" 
  ON public.cleaning_photos 
  FOR SELECT 
  USING (
    customer_id IN (
      SELECT id FROM public.customers c
      JOIN public.profiles p ON p.customer_id = c.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Admins can manage all photos
CREATE POLICY "Admins can manage all cleaning photos" 
  ON public.cleaning_photos 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Create the cleaning.photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cleaning.photos', 'cleaning.photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for cleaning.photos bucket
-- Cleaners can upload photos
CREATE POLICY "Cleaners can upload cleaning photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cleaning.photos' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.cleaners c ON p.cleaner_id = c.id
    WHERE p.user_id = auth.uid()
  )
);

-- Cleaners can view photos they uploaded
CREATE POLICY "Cleaners can view their uploaded photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.cleaners c ON p.cleaner_id = c.id
    WHERE p.user_id = auth.uid()
  )
);

-- Customers can view photos for their bookings
CREATE POLICY "Customers can view their booking photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cleaning.photos' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.customers c ON p.customer_id = c.id
    WHERE p.user_id = auth.uid()
  )
);

-- Admins can manage all photos in cleaning.photos bucket
CREATE POLICY "Admins can manage all cleaning photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'cleaning.photos' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);
