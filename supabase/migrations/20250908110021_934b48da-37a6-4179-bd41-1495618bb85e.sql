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