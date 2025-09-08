-- Свързвам завършените bookings с истинските клиенти

-- Morgan Rooke: от ID 238 към ID 5
UPDATE past_bookings 
SET customer = 5 
WHERE customer = 238;

-- Harry Burley: от ID 3 към ID 223
UPDATE past_bookings 
SET customer = 223 
WHERE customer = 3;

-- Enda: от ID 18 към ID 14
UPDATE past_bookings 
SET customer = 14 
WHERE customer = 18;