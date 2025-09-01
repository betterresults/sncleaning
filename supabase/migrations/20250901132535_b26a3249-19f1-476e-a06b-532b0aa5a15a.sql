-- Create activity logs table to track all user actions
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  user_role text,
  action_type text NOT NULL, -- 'login', 'logout', 'booking_created', 'booking_cancelled', etc.
  entity_type text, -- 'booking', 'customer', 'payment_method', etc.
  entity_id text, -- ID of the affected entity
  details jsonb, -- Store additional details about the action
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Admins can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id uuid,
  p_action_type text,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email_val text;
  user_role_val text;
BEGIN
  -- Get user email and role
  SELECT email INTO user_email_val
  FROM auth.users
  WHERE id = p_user_id;
  
  SELECT role INTO user_role_val
  FROM user_roles
  WHERE user_id = p_user_id;
  
  -- Insert activity log
  INSERT INTO activity_logs (
    user_id, user_email, user_role, action_type, 
    entity_type, entity_id, details
  )
  VALUES (
    p_user_id, user_email_val, user_role_val, p_action_type,
    p_entity_type, p_entity_id, p_details
  );
END;
$$;

-- Create triggers for key tables to automatically log changes

-- Log booking changes
CREATE OR REPLACE FUNCTION public.log_booking_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'booking_created',
      'booking',
      NEW.id::text,
      jsonb_build_object(
        'customer_email', NEW.email,
        'date_time', NEW.date_time,
        'total_cost', NEW.total_cost,
        'address', NEW.address
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.booking_status IS DISTINCT FROM NEW.booking_status THEN
      PERFORM log_activity(
        auth.uid(),
        'booking_status_changed',
        'booking',
        NEW.id::text,
        jsonb_build_object(
          'old_status', OLD.booking_status,
          'new_status', NEW.booking_status,
          'customer_email', NEW.email
        )
      );
    END IF;
    
    -- Log cancellations
    IF NEW.booking_status = 'cancelled' AND OLD.booking_status != 'cancelled' THEN
      PERFORM log_activity(
        auth.uid(),
        'booking_cancelled',
        'booking',
        NEW.id::text,
        jsonb_build_object(
          'customer_email', NEW.email,
          'date_time', NEW.date_time,
          'reason', 'Status changed to cancelled'
        )
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'booking_deleted',
      'booking',
      OLD.id::text,
      jsonb_build_object(
        'customer_email', OLD.email,
        'date_time', OLD.date_time
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for bookings
CREATE TRIGGER bookings_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_changes();

-- Log customer changes
CREATE OR REPLACE FUNCTION public.log_customer_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'customer_created',
      'customer',
      NEW.id::text,
      jsonb_build_object(
        'name', CONCAT(NEW.first_name, ' ', NEW.last_name),
        'email', NEW.email
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(),
      'customer_updated',
      'customer',
      NEW.id::text,
      jsonb_build_object(
        'name', CONCAT(NEW.first_name, ' ', NEW.last_name),
        'email', NEW.email
      )
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for customers
CREATE TRIGGER customers_activity_log
  AFTER INSERT OR UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION log_customer_changes();

-- Log payment method changes
CREATE OR REPLACE FUNCTION public.log_payment_method_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      auth.uid(),
      'payment_method_added',
      'payment_method',
      NEW.id::text,
      jsonb_build_object(
        'customer_id', NEW.customer_id,
        'card_brand', NEW.card_brand,
        'card_last4', NEW.card_last4
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'payment_method_removed',
      'payment_method',
      OLD.id::text,
      jsonb_build_object(
        'customer_id', OLD.customer_id,
        'card_brand', OLD.card_brand,
        'card_last4', OLD.card_last4
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for payment methods
CREATE TRIGGER payment_methods_activity_log
  AFTER INSERT OR DELETE ON customer_payment_methods
  FOR EACH ROW EXECUTE FUNCTION log_payment_method_changes();

-- Create indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);