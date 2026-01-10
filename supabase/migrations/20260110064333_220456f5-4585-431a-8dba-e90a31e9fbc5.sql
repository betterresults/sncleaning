-- Reset was_created_until to end of December 2025 for these recurring services
-- This allows the recurring booking function to regenerate January 2026+ bookings

UPDATE recurring_services 
SET was_created_until = '2025-12-31'
WHERE id IN (2, 43, 7, 37);

-- IDs:
-- 2 = Max Ravera (weekly)
-- 43 = Rebecca Tuck (monthly)  
-- 7 = Sarah Sawyer (bi-weekly)
-- 37 = Mozhgan Samimi