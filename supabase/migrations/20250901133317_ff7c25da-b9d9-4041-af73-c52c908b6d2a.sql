-- Phase 1: Add comprehensive tracking for core business actions

-- Add tracking for linen order items changes
CREATE OR REPLACE FUNCTION public.log_linen_order_item_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_order_item_added',
      'linen_order_item',
      NEW.id::text,
      jsonb_build_object(
        'order_id', NEW.order_id,
        'product_id', NEW.product_id,
        'quantity', NEW.quantity,
        'unit_price', NEW.unit_price,
        'subtotal', NEW.subtotal
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_order_item_updated',
      'linen_order_item',
      NEW.id::text,
      jsonb_build_object(
        'order_id', NEW.order_id,
        'old_quantity', OLD.quantity,
        'new_quantity', NEW.quantity,
        'old_subtotal', OLD.subtotal,
        'new_subtotal', NEW.subtotal
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_order_item_removed',
      'linen_order_item',
      OLD.id::text,
      jsonb_build_object(
        'order_id', OLD.order_id,
        'product_id', OLD.product_id,
        'quantity', OLD.quantity,
        'subtotal', OLD.subtotal
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for linen order items
CREATE TRIGGER linen_order_items_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON linen_order_items
  FOR EACH ROW EXECUTE FUNCTION log_linen_order_item_changes();

-- Add tracking for linen inventory changes
CREATE OR REPLACE FUNCTION public.log_linen_inventory_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_inventory_created',
      'linen_inventory',
      NEW.id::text,
      jsonb_build_object(
        'customer_id', NEW.customer_id,
        'product_id', NEW.product_id,
        'clean_quantity', NEW.clean_quantity,
        'dirty_quantity', NEW.dirty_quantity
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if quantities actually changed
    IF (OLD.clean_quantity IS DISTINCT FROM NEW.clean_quantity) OR 
       (OLD.dirty_quantity IS DISTINCT FROM NEW.dirty_quantity) OR
       (OLD.in_use_quantity IS DISTINCT FROM NEW.in_use_quantity) THEN
      PERFORM log_activity(
        auth.uid(),
        'linen_inventory_updated',
        'linen_inventory',
        NEW.id::text,
        jsonb_build_object(
          'customer_id', NEW.customer_id,
          'product_id', NEW.product_id,
          'old_clean', OLD.clean_quantity,
          'new_clean', NEW.clean_quantity,
          'old_dirty', OLD.dirty_quantity,
          'new_dirty', NEW.dirty_quantity,
          'old_in_use', OLD.in_use_quantity,
          'new_in_use', NEW.in_use_quantity
        )
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for linen inventory
CREATE TRIGGER linen_inventory_activity_log
  AFTER INSERT OR UPDATE ON linen_inventory
  FOR EACH ROW EXECUTE FUNCTION log_linen_inventory_changes();

-- Add tracking for linen products changes
CREATE OR REPLACE FUNCTION public.log_linen_product_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_product_created',
      'linen_product',
      NEW.id::text,
      jsonb_build_object(
        'name', NEW.name,
        'type', NEW.type,
        'price', NEW.price,
        'is_active', NEW.is_active
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_product_updated',
      'linen_product',
      NEW.id::text,
      jsonb_build_object(
        'name', NEW.name,
        'old_price', OLD.price,
        'new_price', NEW.price,
        'old_active', OLD.is_active,
        'new_active', NEW.is_active
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_product_deleted',
      'linen_product',
      OLD.id::text,
      jsonb_build_object(
        'name', OLD.name,
        'type', OLD.type,
        'price', OLD.price
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for linen products
CREATE TRIGGER linen_products_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON linen_products
  FOR EACH ROW EXECUTE FUNCTION log_linen_product_changes();

-- Enhance linen orders tracking
DROP TRIGGER IF EXISTS linen_orders_activity_log ON linen_orders;

CREATE OR REPLACE FUNCTION public.log_linen_order_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_order_created',
      'linen_order',
      NEW.id::text,
      jsonb_build_object(
        'customer_id', NEW.customer_id,
        'total_cost', NEW.total_cost,
        'admin_cost', NEW.admin_cost,
        'delivery_date', NEW.delivery_date,
        'status', NEW.status,
        'payment_status', NEW.payment_status
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_activity(
        auth.uid(),
        'linen_order_status_changed',
        'linen_order',
        NEW.id::text,
        jsonb_build_object(
          'customer_id', NEW.customer_id,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
    
    -- Track payment status changes
    IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
      PERFORM log_activity(
        auth.uid(),
        'linen_order_payment_status_changed',
        'linen_order',
        NEW.id::text,
        jsonb_build_object(
          'customer_id', NEW.customer_id,
          'old_payment_status', OLD.payment_status,
          'new_payment_status', NEW.payment_status
        )
      );
    END IF;
    
    -- Track cost changes
    IF OLD.total_cost IS DISTINCT FROM NEW.total_cost OR OLD.admin_cost IS DISTINCT FROM NEW.admin_cost THEN
      PERFORM log_activity(
        auth.uid(),
        'linen_order_cost_updated',
        'linen_order',
        NEW.id::text,
        jsonb_build_object(
          'customer_id', NEW.customer_id,
          'old_total_cost', OLD.total_cost,
          'new_total_cost', NEW.total_cost,
          'old_admin_cost', OLD.admin_cost,
          'new_admin_cost', NEW.admin_cost
        )
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'linen_order_deleted',
      'linen_order',
      OLD.id::text,
      jsonb_build_object(
        'customer_id', OLD.customer_id,
        'total_cost', OLD.total_cost,
        'status', OLD.status
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create enhanced trigger for linen orders
CREATE TRIGGER linen_orders_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON linen_orders
  FOR EACH ROW EXECUTE FUNCTION log_linen_order_changes();

-- Add tracking for cleaner profile changes (enhance existing)
DROP TRIGGER IF EXISTS cleaners_activity_log ON cleaners;

CREATE OR REPLACE FUNCTION public.log_cleaner_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'cleaner_created',
      'cleaner',
      NEW.id::text,
      jsonb_build_object(
        'name', CONCAT(NEW.first_name, ' ', NEW.last_name),
        'email', NEW.email,
        'hourly_rate', NEW.hourly_rate,
        'percentage_rate', NEW.presentage_rate
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track rate changes
    IF OLD.hourly_rate IS DISTINCT FROM NEW.hourly_rate OR OLD.presentage_rate IS DISTINCT FROM NEW.presentage_rate THEN
      PERFORM log_activity(
        auth.uid(),
        'cleaner_rates_updated',
        'cleaner',
        NEW.id::text,
        jsonb_build_object(
          'name', CONCAT(NEW.first_name, ' ', NEW.last_name),
          'old_hourly_rate', OLD.hourly_rate,
          'new_hourly_rate', NEW.hourly_rate,
          'old_percentage_rate', OLD.presentage_rate,
          'new_percentage_rate', NEW.presentage_rate
        )
      );
    END IF;
    
    -- Track contact info changes
    IF OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone THEN
      PERFORM log_activity(
        auth.uid(),
        'cleaner_contact_updated',
        'cleaner',
        NEW.id::text,
        jsonb_build_object(
          'name', CONCAT(NEW.first_name, ' ', NEW.last_name),
          'old_email', OLD.email,
          'new_email', NEW.email,
          'old_phone', OLD.phone,
          'new_phone', NEW.phone
        )
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'cleaner_deleted',
      'cleaner',
      OLD.id::text,
      jsonb_build_object(
        'name', CONCAT(OLD.first_name, ' ', OLD.last_name),
        'email', OLD.email
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create enhanced trigger for cleaners
CREATE TRIGGER cleaners_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON cleaners
  FOR EACH ROW EXECUTE FUNCTION log_cleaner_changes();

-- Add tracking for sub-booking changes
CREATE OR REPLACE FUNCTION public.log_sub_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'sub_cleaner_assigned',
      'sub_booking',
      NEW.id::text,
      jsonb_build_object(
        'primary_booking_id', NEW.primary_booking_id,
        'cleaner_id', NEW.cleaner_id,
        'hours_assigned', NEW.hours_assigned,
        'payment_method', NEW.payment_method,
        'cleaner_pay', NEW.cleaner_pay
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'sub_cleaner_updated',
      'sub_booking',
      NEW.id::text,
      jsonb_build_object(
        'primary_booking_id', NEW.primary_booking_id,
        'cleaner_id', NEW.cleaner_id,
        'old_hours', OLD.hours_assigned,
        'new_hours', NEW.hours_assigned,
        'old_pay', OLD.cleaner_pay,
        'new_pay', NEW.cleaner_pay
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'sub_cleaner_removed',
      'sub_booking',
      OLD.id::text,
      jsonb_build_object(
        'primary_booking_id', OLD.primary_booking_id,
        'cleaner_id', OLD.cleaner_id,
        'hours_assigned', OLD.hours_assigned
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for sub_bookings
CREATE TRIGGER sub_bookings_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON sub_bookings
  FOR EACH ROW EXECUTE FUNCTION log_sub_booking_changes();

-- Add tracking for pricing formula changes
CREATE OR REPLACE FUNCTION public.log_pricing_formula_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'pricing_formula_created',
      'pricing_formula',
      NEW.id::text,
      jsonb_build_object(
        'formula_name', NEW.formula_name,
        'service_type', NEW.service_type,
        'sub_service_type', NEW.sub_service_type,
        'base_hourly_rate', NEW.base_hourly_rate,
        'is_active', NEW.is_active
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'pricing_formula_updated',
      'pricing_formula',
      NEW.id::text,
      jsonb_build_object(
        'formula_name', NEW.formula_name,
        'service_type', NEW.service_type,
        'old_base_rate', OLD.base_hourly_rate,
        'new_base_rate', NEW.base_hourly_rate,
        'old_active', OLD.is_active,
        'new_active', NEW.is_active
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'pricing_formula_deleted',
      'pricing_formula',
      OLD.id::text,
      jsonb_build_object(
        'formula_name', OLD.formula_name,
        'service_type', OLD.service_type
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for pricing formulas
CREATE TRIGGER pricing_formulas_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON service_pricing_formulas
  FOR EACH ROW EXECUTE FUNCTION log_pricing_formula_changes();

-- Add tracking for user role changes
CREATE OR REPLACE FUNCTION public.log_user_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'user_role_assigned',
      'user_role',
      NEW.id::text,
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'role', NEW.role
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'user_role_changed',
      'user_role',
      NEW.id::text,
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'user_role_removed',
      'user_role',
      OLD.id::text,
      jsonb_build_object(
        'target_user_id', OLD.user_id,
        'role', OLD.role
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for user roles
CREATE TRIGGER user_roles_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_user_role_changes();