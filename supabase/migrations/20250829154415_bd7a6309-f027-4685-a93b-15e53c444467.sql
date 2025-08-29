-- Clear existing sample products and add the actual product catalog
DELETE FROM public.linen_products;

-- Insert the actual linen pack products
INSERT INTO public.linen_products (name, type, price, description, items_included) VALUES
  (
    'Single Bed (Wash & Iron)', 
    'pack', 
    19.95, 
    'Complete single bed linen pack with wash and iron service',
    '1x White Single Duvet Cover, 1x White Single Fitted Sheet, 2x White Pillowcases, 1x White Bath Towel (500gsm), 1x White Hand Towel (500gsm)'
  ),
  (
    'Double Bed (Wash & Iron)', 
    'pack', 
    23.95, 
    'Complete double bed linen pack with wash and iron service',
    '1x White Double Duvet Cover, 1x White Double Fitted Sheet, 4x White Pillowcases, 2x White Bath Towels (500gsm), 2x White Hand Towels (500gsm)'
  ),
  (
    'King Bed (Wash & Iron)', 
    'pack', 
    25.75, 
    'Complete king bed linen pack with wash and iron service',
    '1x White King Duvet Cover, 1x White King Fitted Sheet, 4x White Pillowcases, 2x White Bath Towels (500gsm), 2x White Hand Towels (500gsm)'
  ),
  (
    'Super King Bed (Wash & Iron)', 
    'pack', 
    26.75, 
    'Complete super king bed linen pack with wash and iron service',
    '1x White Super King Duvet Cover, 1x White Super King Fitted Sheet, 4x White Pillowcases, 2x White Bath Towels (500gsm), 2x White Hand Towels (500gsm)'
  );

-- Insert the individual linen items
INSERT INTO public.linen_products (name, type, price, description, items_included) VALUES
  (
    'Bath Mat', 
    'individual', 
    2.80, 
    'White bath mat for bathroom use',
    '1x White Bath Mat'
  ),
  (
    'Bath Sheet', 
    'individual', 
    3.10, 
    'Large white bath sheet towel',
    '1x White Bath Sheet'
  ),
  (
    'Bath Robe', 
    'individual', 
    6.50, 
    'White bath robe for guest comfort',
    '1x White Bath Robe'
  ),
  (
    'Tea Towel', 
    'individual', 
    1.30, 
    'White tea towel for kitchen use',
    '1x White Tea Towel'
  );