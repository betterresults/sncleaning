-- Delete user completely: sinsip.2014@gmail.com (Silvia Nedeva)
-- User ID: 701ebe58-d164-45c9-8f3d-41d1cab7b037

-- First delete from user_roles table
DELETE FROM public.user_roles 
WHERE user_id = '701ebe58-d164-45c9-8f3d-41d1cab7b037';

-- Delete from profiles table
DELETE FROM public.profiles 
WHERE user_id = '701ebe58-d164-45c9-8f3d-41d1cab7b037';

-- Finally delete from auth.users table
DELETE FROM auth.users 
WHERE id = '701ebe58-d164-45c9-8f3d-41d1cab7b037';