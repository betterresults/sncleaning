-- Add payment fields to linen_orders table
ALTER TABLE public.linen_orders 
ADD COLUMN payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'pending', 'refunded')),
ADD COLUMN payment_method text CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'stripe', 'invoice'));

-- Create booking_linen_usage table to track linen usage per booking
CREATE TABLE public.booking_linen_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id bigint NOT NULL,
  product_id uuid NOT NULL REFERENCES public.linen_products(id) ON DELETE CASCADE,
  customer_id bigint NOT NULL,
  address_id uuid NOT NULL REFERENCES public.addresses(id) ON DELETE CASCADE,
  quantity_used integer NOT NULL DEFAULT 0,
  quantity_dirty integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_use' CHECK (status IN ('in_use', 'dirty', 'clean', 'replaced')),
  booking_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on booking_linen_usage
ALTER TABLE public.booking_linen_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for booking_linen_usage
CREATE POLICY "Admins can manage all booking linen usage"
ON public.booking_linen_usage
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Cleaners can view and update their booking linen usage"
ON public.booking_linen_usage
FOR ALL
USING (
  booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.profiles p ON p.cleaner_id = b.cleaner
    WHERE p.user_id = auth.uid() AND p.cleaner_id IS NOT NULL
  )
);

-- Create inventory movements table for tracking changes
CREATE TABLE public.linen_inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.linen_products(id) ON DELETE CASCADE,
  customer_id bigint NOT NULL,
  address_id uuid NOT NULL REFERENCES public.addresses(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('delivery', 'pickup', 'cleaning_usage', 'manual_adjustment', 'loss', 'replacement')),
  quantity_clean_change integer NOT NULL DEFAULT 0,
  quantity_dirty_change integer NOT NULL DEFAULT 0,
  reference_id uuid, -- Can reference order_id, booking_id, etc.
  reference_type text, -- 'order', 'booking', 'manual', etc.
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on linen_inventory_movements
ALTER TABLE public.linen_inventory_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for linen_inventory_movements
CREATE POLICY "Admins can manage all inventory movements"
ON public.linen_inventory_movements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Customers can view their inventory movements"
ON public.linen_inventory_movements
FOR SELECT
USING (
  customer_id IN (
    SELECT profiles.customer_id FROM public.profiles
    WHERE profiles.user_id = auth.uid() AND profiles.customer_id IS NOT NULL
  )
);

-- Create function to update linen inventory from movements
CREATE OR REPLACE FUNCTION public.update_linen_inventory_from_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert or update inventory record
  INSERT INTO public.linen_inventory (
    product_id,
    customer_id,
    address_id,
    clean_quantity,
    dirty_quantity,
    last_updated
  )
  VALUES (
    NEW.product_id,
    NEW.customer_id,
    NEW.address_id,
    GREATEST(0, NEW.quantity_clean_change),
    GREATEST(0, NEW.quantity_dirty_change),
    NEW.created_at
  )
  ON CONFLICT (product_id, customer_id, address_id)
  DO UPDATE SET
    clean_quantity = GREATEST(0, linen_inventory.clean_quantity + NEW.quantity_clean_change),
    dirty_quantity = GREATEST(0, linen_inventory.dirty_quantity + NEW.quantity_dirty_change),
    last_updated = NEW.created_at;
    
  RETURN NEW;
END;
$$;

-- Create trigger for inventory movements
CREATE TRIGGER update_inventory_on_movement
  AFTER INSERT ON public.linen_inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_linen_inventory_from_movement();

-- Create trigger to update linen_orders updated_at
CREATE TRIGGER update_linen_orders_updated_at
  BEFORE UPDATE ON public.linen_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_linen_updated_at_column();

-- Create trigger to update booking_linen_usage updated_at
CREATE TRIGGER update_booking_linen_usage_updated_at
  BEFORE UPDATE ON public.booking_linen_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_linen_updated_at_column();