ALTER TABLE public.sms_reminders_queue 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'invoice';