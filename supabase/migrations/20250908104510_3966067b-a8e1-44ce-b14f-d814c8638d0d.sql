-- Fix the log_customer_changes function to properly handle data types
CREATE OR REPLACE FUNCTION public.log_customer_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Use more defensive programming for log_activity calls
    PERFORM log_activity(
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
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
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
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