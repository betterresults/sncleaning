-- Drop the foreign key constraint on customer_id since payment links may be created
-- for customers that don't exist yet in the customers table, or for test scenarios
ALTER TABLE public.short_links 
DROP CONSTRAINT IF EXISTS short_links_customer_id_fkey;