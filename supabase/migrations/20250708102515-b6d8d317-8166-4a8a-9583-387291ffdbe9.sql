-- Create table to track photo completion notifications to prevent duplicates
CREATE TABLE public.photo_completion_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  chat_message_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_photo_completion_notifications_booking_id ON public.photo_completion_notifications(booking_id);

-- Enable RLS
ALTER TABLE public.photo_completion_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can manage these notifications
CREATE POLICY "Admins can manage photo completion notifications" 
  ON public.photo_completion_notifications 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Create function to trigger completion workflow when after photos are uploaded
CREATE OR REPLACE FUNCTION public.trigger_completion_workflow()
RETURNS TRIGGER AS $$
DECLARE
  existing_notification_id UUID;
BEGIN
  -- Only trigger for 'after' photos
  IF NEW.photo_type = 'after' THEN
    -- Check if we already have a notification for this booking
    SELECT id INTO existing_notification_id 
    FROM public.photo_completion_notifications 
    WHERE booking_id = NEW.booking_id;
    
    -- If no existing notification, create one and schedule the workflow
    IF existing_notification_id IS NULL THEN
      INSERT INTO public.photo_completion_notifications (booking_id)
      VALUES (NEW.booking_id);
      
      -- Schedule the completion workflow for 30 minutes later using pg_cron
      -- This will be handled by our edge function
      PERFORM net.http_post(
        url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/schedule-completion-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
        body := json_build_object('booking_id', NEW.booking_id, 'delay_minutes', 30)::jsonb
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on cleaning_photos table
CREATE TRIGGER trigger_after_photos_completion
  AFTER INSERT ON public.cleaning_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_completion_workflow();