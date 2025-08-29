-- Add linen management columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN linen_management boolean DEFAULT false,
ADD COLUMN linen_used jsonb DEFAULT null;

-- Create function to update inventory when booking is completed
CREATE OR REPLACE FUNCTION update_inventory_on_booking_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'completed' and linen_management is true
  IF NEW.booking_status = 'completed' 
     AND (OLD.booking_status IS NULL OR OLD.booking_status != 'completed')
     AND NEW.linen_management = true 
     AND NEW.linen_used IS NOT NULL THEN
    
    -- Update inventory for each linen product used
    WITH linen_usage AS (
      SELECT 
        jsonb_array_elements(NEW.linen_used) as item
    )
    UPDATE linen_inventory 
    SET 
      clean_quantity = clean_quantity - (item->>'quantity')::integer,
      dirty_quantity = dirty_quantity + (item->>'quantity')::integer,
      last_updated = NOW()
    FROM linen_usage
    WHERE linen_inventory.customer_id = NEW.customer
      AND linen_inventory.product_id::text = item->>'product_id'
      AND clean_quantity >= (item->>'quantity')::integer;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking completion
DROP TRIGGER IF EXISTS trigger_update_inventory_on_booking_completion ON bookings;
CREATE TRIGGER trigger_update_inventory_on_booking_completion
  AFTER UPDATE OF booking_status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_booking_completion();

-- Create function to update inventory when linen order is picked up
CREATE OR REPLACE FUNCTION update_inventory_on_linen_pickup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'picked_up'
  IF NEW.status = 'picked_up' AND (OLD.status IS NULL OR OLD.status != 'picked_up') THEN
    
    -- Move dirty linen back to clean based on order items
    UPDATE linen_inventory 
    SET 
      dirty_quantity = GREATEST(0, dirty_quantity - loi.quantity),
      clean_quantity = clean_quantity + LEAST(dirty_quantity, loi.quantity),
      last_updated = NOW()
    FROM linen_order_items loi
    WHERE loi.order_id = NEW.id
      AND linen_inventory.customer_id = NEW.customer_id
      AND linen_inventory.address_id = NEW.address_id
      AND linen_inventory.product_id = loi.product_id;
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for linen pickup
DROP TRIGGER IF EXISTS trigger_update_inventory_on_linen_pickup ON linen_orders;
CREATE TRIGGER trigger_update_inventory_on_linen_pickup
  AFTER UPDATE OF status ON linen_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_linen_pickup();