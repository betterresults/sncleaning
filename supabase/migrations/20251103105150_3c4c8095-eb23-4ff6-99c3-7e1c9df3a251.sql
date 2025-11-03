-- Add supplier_cost column to linen_products table
ALTER TABLE linen_products 
ADD COLUMN supplier_cost numeric DEFAULT 0;

COMMENT ON COLUMN linen_products.supplier_cost IS 'Cost paid to supplier for this product';