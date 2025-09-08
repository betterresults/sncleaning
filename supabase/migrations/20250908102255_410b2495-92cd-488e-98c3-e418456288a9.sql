-- Fix the log_activity function to handle NULL values and type casting properly
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
  -- Handle NULL user_id case
  IF p_user_id IS NULL THEN
    user_email_val := 'system';
    user_role_val := 'system';
  ELSE
    -- Get user email and role
    SELECT email INTO user_email_val
    FROM auth.users
    WHERE id = p_user_id;
    
    SELECT role INTO user_role_val
    FROM user_roles
    WHERE user_id = p_user_id;
  END IF;
  
  -- Insert activity log with proper type casting
  INSERT INTO activity_logs (
    user_id, user_email, user_role, action_type, 
    entity_type, entity_id, details
  )
  VALUES (
    p_user_id, 
    COALESCE(user_email_val, 'unknown'), 
    COALESCE(user_role_val, 'unknown'), 
    COALESCE(p_action_type, 'unknown'),
    p_entity_type, 
    p_entity_id, 
    COALESCE(p_details, '{}'::jsonb)
  );
END;
$function$