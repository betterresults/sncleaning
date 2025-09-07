-- Add send_notification_email column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN send_notification_email boolean DEFAULT true;