-- Delete Gabriel Douglas's account before testing new email system
DELETE FROM auth.users WHERE email = 'info@sncleaningservices.co.uk';

-- Also clean up the profile
DELETE FROM profiles WHERE email = 'info@sncleaningservices.co.uk';