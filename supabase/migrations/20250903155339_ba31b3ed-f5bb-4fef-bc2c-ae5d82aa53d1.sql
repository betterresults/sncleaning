-- First, remove duplicate payment methods, keeping only the first one for each customer/payment_method combination
DELETE FROM customer_payment_methods 
WHERE id NOT IN (
  SELECT DISTINCT ON (customer_id, stripe_payment_method_id) id 
  FROM customer_payment_methods 
  ORDER BY customer_id, stripe_payment_method_id, created_at ASC
);

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE customer_payment_methods 
ADD CONSTRAINT unique_customer_payment_method 
UNIQUE (customer_id, stripe_payment_method_id);