-- Delete incorrect fields that don't match the actual Airbnb form
DELETE FROM airbnb_field_configs 
WHERE category IN ('Linen Management', 'Booking Timing', 'Ironing', 'Property Occupancy', 'Cleaning History', 'Booking Frequency');

-- Property Type already exists, just update it
UPDATE airbnb_field_configs SET time = 120, value = 0, value_type = 'fixed' WHERE category = 'Property Type' AND option = 'flat';
UPDATE airbnb_field_configs SET time = 180, value = 0, value_type = 'fixed' WHERE category = 'Property Type' AND option = 'house';