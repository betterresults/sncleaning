-- Fix the critical RLS issues - ensure RLS is enabled on tables that need it
-- The linter detected that some existing tables have policies but RLS disabled

-- Check and enable RLS on any tables that might be missing it
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing_formulas ENABLE ROW LEVEL SECURITY;

-- Fix function security by adding search_path to the new functions
CREATE OR REPLACE FUNCTION public.update_linen_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_linen_item_subtotal()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.subtotal = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_linen_order_total()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;