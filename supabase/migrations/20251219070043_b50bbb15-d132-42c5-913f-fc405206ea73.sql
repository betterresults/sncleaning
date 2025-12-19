-- Create enum for payment period
CREATE TYPE public.payment_period AS ENUM ('weekly', 'biweekly', 'monthly');

-- Add bank account details columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN bank_name text,
ADD COLUMN sort_code text,
ADD COLUMN account_number text,
ADD COLUMN iban text,
ADD COLUMN account_holder_name text,
ADD COLUMN payment_period public.payment_period DEFAULT 'monthly';