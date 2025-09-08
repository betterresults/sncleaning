-- Add resume_date column to recurring_services table
ALTER TABLE public.recurring_services 
ADD COLUMN IF NOT EXISTS resume_date timestamp with time zone;