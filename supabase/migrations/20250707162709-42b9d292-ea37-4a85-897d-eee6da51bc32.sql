-- Update reviews table structure to reference past_bookings
DROP TABLE IF EXISTS public.reviews;

CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  past_booking_id BIGINT NOT NULL REFERENCES public.past_bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Customers can view reviews for their bookings" 
ON public.reviews 
FOR SELECT 
USING (
  past_booking_id IN (
    SELECT pb.id 
    FROM public.past_bookings pb
    JOIN public.customers c ON pb.customer = c.id
    JOIN public.profiles p ON p.customer_id = c.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can create reviews for their bookings" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  past_booking_id IN (
    SELECT pb.id 
    FROM public.past_bookings pb
    JOIN public.customers c ON pb.customer = c.id
    JOIN public.profiles p ON p.customer_id = c.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (
  past_booking_id IN (
    SELECT pb.id 
    FROM public.past_bookings pb
    JOIN public.customers c ON pb.customer = c.id
    JOIN public.profiles p ON p.customer_id = c.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Cleaners can view reviews for their bookings" 
ON public.reviews 
FOR SELECT 
USING (
  past_booking_id IN (
    SELECT pb.id 
    FROM public.past_bookings pb
    JOIN public.cleaners cl ON pb.cleaner = cl.id
    JOIN public.profiles p ON p.cleaner_id = cl.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_methods_updated_at_column();