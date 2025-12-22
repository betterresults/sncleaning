-- Import existing SMS messages from notification_logs into sms_conversations
INSERT INTO public.sms_conversations (phone_number, customer_id, customer_name, direction, message, status, booking_id, created_at)
SELECT 
  nl.recipient_email as phone_number,
  b.customer as customer_id,
  COALESCE(c.full_name, c.first_name || ' ' || c.last_name, b.first_name || ' ' || b.last_name) as customer_name,
  'outgoing' as direction,
  nl.content as message,
  nl.status,
  CASE WHEN nl.entity_id ~ '^\d+$' THEN nl.entity_id::bigint ELSE NULL END as booking_id,
  nl.created_at
FROM notification_logs nl
LEFT JOIN bookings b ON nl.entity_id ~ '^\d+$' AND b.id = nl.entity_id::bigint
LEFT JOIN customers c ON b.customer = c.id
WHERE nl.notification_type = 'sms'
ON CONFLICT DO NOTHING;