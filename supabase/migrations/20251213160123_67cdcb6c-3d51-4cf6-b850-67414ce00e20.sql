-- Add payment_status_unpaid condition to all notification triggers except payment_received
UPDATE notification_triggers
SET conditions = CASE
  WHEN id = '8123075f-56f9-412f-af3e-139166a4f52d' THEN '["no_payment_method", "payment_method_card", "payment_status_unpaid"]'::jsonb
  WHEN id = 'de9646b6-93f5-490a-bddb-cac105a4e86e' THEN '["no_payment_method", "payment_method_card", "payment_status_unpaid"]'::jsonb
  ELSE '["payment_status_unpaid"]'::jsonb
END
WHERE id IN (
  'f6dbf75b-3dea-47fa-b699-8ba15e6c7e55', -- Booking Completed
  '451c2bbf-57b7-45d3-bdff-29a42b0c354f', -- Booking Rescheduled
  'adacc71e-9091-427d-9948-191a75dfbe83', -- Booking Reminder
  'ea96dc75-d54e-4068-bb01-2539002d416b', -- Photos Uploaded
  'f297216d-d80a-4674-b1e0-8556f1de5b78', -- Payment Authorization Failed
  'dbc39dbd-9ab1-4cc1-b4c9-2d348171b20a', -- Booking Created
  '657cd2b1-49ab-49d2-85e5-982c06951424', -- Authorization Failed
  '8123075f-56f9-412f-af3e-139166a4f52d', -- Get Payment Details
  'de9646b6-93f5-490a-bddb-cac105a4e86e'  -- Payment Reminder 48h
);