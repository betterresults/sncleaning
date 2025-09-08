-- Fix the foreign key constraint issue by allowing NULL user_id in activity_logs
-- and updating the log_activity function to handle NULL properly

-- First, remove the foreign key constraint temporarily
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

-- Now update the log_activity function to handle NULL user_id properly
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id uuid, 
  p_action_type text, 
  p_entity_type text DEFAULT NULL::text, 
  p_entity_id text DEFAULT NULL::text, 
  p_details jsonb DEFAULT NULL::jsonb
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email_val text;
  user_role_val text;
BEGIN
  -- Handle NULL user_id case (system operations)
  IF p_user_id IS NULL THEN
    user_email_val := 'system';
    user_role_val := 'system';
  ELSE
    -- Get user email and role only if user_id is not NULL
    BEGIN
      SELECT email INTO user_email_val
      FROM auth.users
      WHERE id = p_user_id;
      
      SELECT role INTO user_role_val
      FROM user_roles
      WHERE user_id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
      user_email_val := 'unknown';
      user_role_val := 'unknown';
    END;
  END IF;
  
  -- Insert activity log - allow NULL user_id for system operations
  INSERT INTO activity_logs (
    user_id, user_email, user_role, action_type, 
    entity_type, entity_id, details
  )
  VALUES (
    p_user_id, -- This can be NULL for system operations
    COALESCE(user_email_val, 'unknown'), 
    COALESCE(user_role_val, 'unknown'), 
    COALESCE(p_action_type, 'unknown'),
    p_entity_type, 
    p_entity_id, 
    COALESCE(p_details, '{}'::jsonb)
  );
END;
$function$

-- Update the log_customer_changes function to pass NULL instead of fake UUID
CREATE OR REPLACE FUNCTION public.log_customer_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Pass NULL instead of fake UUID when auth.uid() is NULL
    PERFORM log_activity(
      auth.uid(), -- This can be NULL
      'customer_created',
      'customer',
      COALESCE(NEW.id::text, 'unknown'),
      jsonb_build_object(
        'name', COALESCE(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')), 'Unknown'),
        'email', COALESCE(NEW.email, 'no-email')
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      auth.uid(), -- This can be NULL
      'customer_updated',
      'customer',
      COALESCE(NEW.id::text, 'unknown'),
      jsonb_build_object(
        'name', COALESCE(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')), 'Unknown'),
        'email', COALESCE(NEW.email, 'no-email'),
        'old_email', COALESCE(OLD.email, 'no-email')
      )
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$