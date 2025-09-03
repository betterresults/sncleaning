-- Add unique constraint to prevent duplicate payment methods
ALTER TABLE customer_payment_methods 
ADD CONSTRAINT unique_customer_payment_method 
UNIQUE (customer_id, stripe_payment_method_id);