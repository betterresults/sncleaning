-- Add in_use_quantity column to linen_inventory table
ALTER TABLE public.linen_inventory 
ADD COLUMN in_use_quantity integer NOT NULL DEFAULT 0;