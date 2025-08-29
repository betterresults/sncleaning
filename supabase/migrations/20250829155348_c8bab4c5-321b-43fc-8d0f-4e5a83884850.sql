-- Add payment fields to linen_orders table
ALTER TABLE public.linen_orders 
ADD COLUMN payment_status text DEFAULT 'unpaid',
ADD COLUMN payment_method text;