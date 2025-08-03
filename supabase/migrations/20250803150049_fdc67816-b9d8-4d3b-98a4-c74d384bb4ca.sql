-- Manually insert the missing photo records for booking 108248
-- Based on the storage files found, create the database records

INSERT INTO public.cleaning_photos (
  booking_id, 
  customer_id, 
  cleaner_id, 
  file_path, 
  photo_type, 
  postcode, 
  booking_date
) VALUES
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233002215_0_1000036995.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233002216_1_1000036993.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233002216_2_1000036991.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233002216_3_1000036989.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233002216_4_1000036987.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754233002216_5_1000036985.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754232726989_0_1000037662.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754232726992_1_1000037664.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754232726992_2_1000037666.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754232726992_3_1000037668.jpg', 'before', 'SE164NF', '2025-07-29'),
(108248, 29, 1, '108248_SE164NF_2025-07-29_29/before/1754232726992_4_1000037670.jpg', 'before', 'SE164NF', '2025-07-29');