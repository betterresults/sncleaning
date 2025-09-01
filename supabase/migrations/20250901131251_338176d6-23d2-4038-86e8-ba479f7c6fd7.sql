-- Add admin cost tracking field to linen orders
ALTER TABLE public.linen_orders 
ADD COLUMN admin_cost NUMERIC DEFAULT 0;