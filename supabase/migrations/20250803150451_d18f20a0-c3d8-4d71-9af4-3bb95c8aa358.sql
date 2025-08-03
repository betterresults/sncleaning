-- Add the 5 new photos that were uploaded but missing from database
INSERT INTO public.cleaning_photos (
  booking_id, 
  customer_id, 
  cleaner_id, 
  file_path, 
  photo_type, 
  postcode, 
  booking_date
) VALUES
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233306088_0_1000017220.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233306090_1_1000013729.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233306090_2_1000010159.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233306090_3_1000015612.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233306090_4_1000012943.jpg', 'before', 'SE164NF', '2025-07-29');