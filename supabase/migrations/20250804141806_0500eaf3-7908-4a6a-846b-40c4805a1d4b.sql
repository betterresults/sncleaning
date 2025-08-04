-- Delete Gabriel Douglas's account again
DELETE FROM auth.users WHERE email = 'info@sncleaningservices.co.uk';

-- Also clean up the profile
DELETE FROM profiles WHERE email = 'info@sncleaningservices.co.uk';