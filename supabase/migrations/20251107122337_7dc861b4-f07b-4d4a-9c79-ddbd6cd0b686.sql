-- Add invoiless_id column to customers table to track Invoiless customer IDs
ALTER TABLE customers ADD COLUMN invoiless_id text;