-- Delete Gabriel Douglas's unlinked account
DELETE FROM auth.users WHERE email = 'info@sncleaningservices.co.uk';

-- Also clean up any remaining profile
DELETE FROM profiles WHERE email = 'info@sncleaningservices.co.uk';