-- Phase 1: Fix Core Linking System

-- First, let's update the handle_new_user trigger to properly link customers and cleaners
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role_value text;
  app_role_value text;
  existing_cleaner_id bigint;
  existing_customer_id bigint;
BEGIN
  -- Default to 'guest' for public signups (customers)
  user_role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'guest');
  app_role_value := COALESCE(NEW.raw_user_meta_data ->> 'role', 'guest');
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    user_role_value::user_role
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    app_role_value::app_role
  );
  
  -- Try to link to existing cleaner record by email
  IF user_role_value = 'user' THEN
    SELECT id INTO existing_cleaner_id 
    FROM public.cleaners 
    WHERE LOWER(email) = LOWER(NEW.email);
    
    IF existing_cleaner_id IS NOT NULL THEN
      -- Update the profile with the cleaner_id
      UPDATE public.profiles 
      SET cleaner_id = existing_cleaner_id
      WHERE user_id = NEW.id;
      
      -- Update cleaner's name if it's missing
      UPDATE public.cleaners 
      SET 
        first_name = COALESCE(NULLIF(first_name, ''), NEW.raw_user_meta_data ->> 'first_name'),
        last_name = COALESCE(NULLIF(last_name, ''), NEW.raw_user_meta_data ->> 'last_name')
      WHERE id = existing_cleaner_id;
    END IF;
  END IF;
  
  -- Try to link to existing customer record by email
  IF user_role_value = 'guest' THEN
    SELECT id INTO existing_customer_id 
    FROM public.customers 
    WHERE LOWER(email) = LOWER(NEW.email);
    
    IF existing_customer_id IS NOT NULL THEN
      -- Update the profile with the customer_id
      UPDATE public.profiles 
      SET customer_id = existing_customer_id
      WHERE user_id = NEW.id;
      
      -- Update customer's name if it's missing
      UPDATE public.customers 
      SET 
        first_name = COALESCE(NULLIF(first_name, ''), NEW.raw_user_meta_data ->> 'first_name'),
        last_name = COALESCE(NULLIF(last_name, ''), NEW.raw_user_meta_data ->> 'last_name')
      WHERE id = existing_customer_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;