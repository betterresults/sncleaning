-- Add payment_link column to sms_reminders_queue
ALTER TABLE public.sms_reminders_queue 
ADD COLUMN IF NOT EXISTS payment_link text NOT NULL DEFAULT '';

-- Update the default after adding column to avoid migration issues
ALTER TABLE public.sms_reminders_queue 
ALTER COLUMN payment_link DROP DEFAULT;