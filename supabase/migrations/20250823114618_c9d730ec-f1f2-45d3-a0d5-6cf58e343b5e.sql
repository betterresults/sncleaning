-- Delete the orphaned user from auth.users
-- This will allow you to recreate the customer properly
DELETE FROM auth.users WHERE email = 'seo.silvi@gmail.com';