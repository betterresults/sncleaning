-- Drop the existing linens table (it was just a test)
DROP TABLE IF EXISTS public.linens CASCADE;

-- Create linen_products table (Product Catalog)
CREATE TABLE public.linen_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('pack', 'individual')),
  price numeric(10,2) NOT NULL DEFAULT 0,
  description text,
  items_included text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create linen_orders table (Main Orders)
CREATE TABLE public.linen_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id bigint NOT NULL,
  address_id uuid NOT NULL,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  pickup_date date,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'delivered', 'picked_up', 'cancelled', 'postponed')),
  total_cost numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create linen_order_items table (Items in each order)
CREATE TABLE public.linen_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.linen_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.linen_products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create linen_inventory table (Track what's at each property)
CREATE TABLE public.linen_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id bigint NOT NULL,
  address_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.linen_products(id) ON DELETE CASCADE,
  clean_quantity integer NOT NULL DEFAULT 0 CHECK (clean_quantity >= 0),
  dirty_quantity integer NOT NULL DEFAULT 0 CHECK (dirty_quantity >= 0),
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_id, address_id, product_id)
);

-- Enable RLS on all tables
ALTER TABLE public.linen_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linen_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linen_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for linen_products
CREATE POLICY "Everyone can view active linen products" ON public.linen_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all linen products" ON public.linen_products
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- RLS Policies for linen_orders
CREATE POLICY "Customers can view their own linen orders" ON public.linen_orders
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.profiles 
      WHERE user_id = auth.uid() AND customer_id IS NOT NULL
    )
  );

CREATE POLICY "Customers can create their own linen orders" ON public.linen_orders
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT customer_id FROM public.profiles 
      WHERE user_id = auth.uid() AND customer_id IS NOT NULL
    )
  );

CREATE POLICY "Customers can update their own linen orders" ON public.linen_orders
  FOR UPDATE USING (
    customer_id IN (
      SELECT customer_id FROM public.profiles 
      WHERE user_id = auth.uid() AND customer_id IS NOT NULL
    )
  );

CREATE POLICY "Admins can manage all linen orders" ON public.linen_orders
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- RLS Policies for linen_order_items
CREATE POLICY "Users can view linen order items for their orders" ON public.linen_order_items
  FOR SELECT USING (
    order_id IN (
      SELECT lo.id FROM public.linen_orders lo
      WHERE lo.customer_id IN (
        SELECT customer_id FROM public.profiles 
        WHERE user_id = auth.uid() AND customer_id IS NOT NULL
      )
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Users can insert linen order items for their orders" ON public.linen_order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT lo.id FROM public.linen_orders lo
      WHERE lo.customer_id IN (
        SELECT customer_id FROM public.profiles 
        WHERE user_id = auth.uid() AND customer_id IS NOT NULL
      )
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admins can manage all linen order items" ON public.linen_order_items
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- RLS Policies for linen_inventory
CREATE POLICY "Customers can view their own linen inventory" ON public.linen_inventory
  FOR SELECT USING (
    customer_id IN (
      SELECT customer_id FROM public.profiles 
      WHERE user_id = auth.uid() AND customer_id IS NOT NULL
    )
  );

CREATE POLICY "Admins can manage all linen inventory" ON public.linen_inventory
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_linen_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_linen_products_updated_at
  BEFORE UPDATE ON public.linen_products
  FOR EACH ROW EXECUTE FUNCTION public.update_linen_updated_at_column();

CREATE TRIGGER update_linen_orders_updated_at
  BEFORE UPDATE ON public.linen_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_linen_updated_at_column();

-- Create trigger to automatically calculate subtotal in linen_order_items
CREATE OR REPLACE FUNCTION public.calculate_linen_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_linen_order_item_subtotal
  BEFORE INSERT OR UPDATE ON public.linen_order_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_linen_item_subtotal();

-- Create function to update linen_orders total_cost when items change
CREATE OR REPLACE FUNCTION public.update_linen_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.linen_orders 
  SET total_cost = (
    SELECT COALESCE(SUM(subtotal), 0) 
    FROM public.linen_order_items 
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_linen_order_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.linen_order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_linen_order_total();

-- Seed some sample linen products
INSERT INTO public.linen_products (name, type, price, description, items_included) VALUES
  ('Single Bed Pack', 'pack', 19.95, 'Complete single bed linen set', '1x Duvet Cover, 1x Fitted Sheet, 1x Pillowcase'),
  ('Double Bed Pack', 'pack', 23.95, 'Complete double bed linen set', '1x Duvet Cover, 1x Fitted Sheet, 2x Pillowcases'),
  ('King Bed Pack', 'pack', 27.95, 'Complete king size bed linen set', '1x Duvet Cover, 1x Fitted Sheet, 2x Pillowcases'),
  ('Bath Towel', 'individual', 3.10, 'Premium bath towel', '1x Bath Towel'),
  ('Hand Towel', 'individual', 2.50, 'Premium hand towel', '1x Hand Towel'),
  ('Tea Towel', 'individual', 1.85, 'Kitchen tea towel', '1x Tea Towel'),
  ('Towel Set', 'pack', 8.95, 'Complete towel set', '1x Bath Towel, 2x Hand Towels, 2x Face Cloths');