-- Create notification trigger for authorization_failed event
INSERT INTO public.notification_triggers (
  name,
  trigger_event,
  template_id,
  recipient_types,
  notification_channel,
  is_enabled,
  timing_offset,
  timing_unit
) VALUES (
  'Authorization Failed Notification',
  'authorization_failed',
  '8b244981-3823-49e0-98b8-e858a5dace71',
  ARRAY['customer', 'admin'],
  'email',
  true,
  0,
  'minutes'
);