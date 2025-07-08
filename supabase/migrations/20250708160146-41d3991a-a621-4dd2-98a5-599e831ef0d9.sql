-- Create a trigger function that calls the auto-photo-notification edge function when a photo is uploaded
CREATE OR REPLACE FUNCTION public.trigger_auto_photo_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the auto-photo-notification edge function
  PERFORM net.http_post(
    url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/auto-photo-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4"}'::jsonb,
    body := json_build_object(
      'file_path', NEW.file_path,
      'booking_id', NEW.booking_id,
      'customer_id', NEW.customer_id,
      'postcode', NEW.postcode,
      'booking_date', NEW.booking_date
    )::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a new photo is inserted
DROP TRIGGER IF EXISTS trigger_auto_photo_notification ON public.cleaning_photos;
CREATE TRIGGER trigger_auto_photo_notification
  AFTER INSERT ON public.cleaning_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_photo_notification();