-- Fix admin user profile to ensure proper role detection

-- First, check if profile exists
DO $$
DECLARE
    profile_exists boolean;
    admin_user_id uuid := 'c85ef1fd-c6dc-4393-bc81-c3944c67fb14';
BEGIN
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = admin_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create profile for admin user
        INSERT INTO profiles (user_id, role, first_name, last_name, email)
        SELECT 
            id,
            'admin'::user_role,
            'Admin',
            'User',
            email
        FROM auth.users 
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'Created profile for admin user';
    ELSE
        -- Update existing profile to ensure admin role
        UPDATE profiles 
        SET role = 'admin'::user_role
        WHERE user_id = admin_user_id;
        
        RAISE NOTICE 'Updated existing profile to admin role';
    END IF;
END $$;