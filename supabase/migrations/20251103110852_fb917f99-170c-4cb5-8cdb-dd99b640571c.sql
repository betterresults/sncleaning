-- Add delivery and packaging charges to linen_orders table
ALTER TABLE linen_orders 
ADD COLUMN delivery_charge numeric DEFAULT 0,
ADD COLUMN packaging_charge numeric DEFAULT 0;