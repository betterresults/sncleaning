-- First, create inventory records for the existing delivered order
INSERT INTO linen_inventory (customer_id, address_id, product_id, clean_quantity, dirty_quantity, last_updated)
SELECT 
  lo.customer_id,
  lo.address_id,
  loi.product_id,
  loi.quantity as clean_quantity,
  0 as dirty_quantity,
  NOW() as last_updated
FROM linen_orders lo
JOIN linen_order_items loi ON lo.id = loi.order_id
WHERE lo.status = 'delivered'
  AND NOT EXISTS (
    SELECT 1 FROM linen_inventory li 
    WHERE li.customer_id = lo.customer_id 
      AND li.address_id = lo.address_id 
      AND li.product_id = loi.product_id
  );

-- Create a function to handle inventory creation when orders are delivered
CREATE OR REPLACE FUNCTION create_inventory_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    
    -- Create or update inventory records for each order item
    INSERT INTO linen_inventory (customer_id, address_id, product_id, clean_quantity, dirty_quantity, last_updated)
    SELECT 
      NEW.customer_id,
      NEW.address_id,
      loi.product_id,
      loi.quantity,
      0,
      NOW()
    FROM linen_order_items loi
    WHERE loi.order_id = NEW.id
    ON CONFLICT (customer_id, address_id, product_id) 
    DO UPDATE SET
      clean_quantity = linen_inventory.clean_quantity + EXCLUDED.clean_quantity,
      last_updated = NOW();
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create inventory on delivery
DROP TRIGGER IF EXISTS trigger_create_inventory_on_delivery ON linen_orders;
CREATE TRIGGER trigger_create_inventory_on_delivery
  AFTER UPDATE OF status ON linen_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_on_delivery();

-- Add unique constraint to prevent duplicate inventory records
ALTER TABLE linen_inventory 
ADD CONSTRAINT unique_inventory_per_location 
UNIQUE (customer_id, address_id, product_id);