-- Add notification_type column to notification_logs table
ALTER TABLE notification_logs 
ADD COLUMN notification_type text NOT NULL DEFAULT 'email' CHECK (notification_type IN ('email', 'sms'));

-- Create sms_reminders_queue table for tracking automatic SMS reminders
CREATE TABLE sms_reminders_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id bigint NOT NULL,
  phone_number text NOT NULL,
  customer_name text NOT NULL,
  amount numeric NOT NULL,
  send_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  error_message text,
  CONSTRAINT fk_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Enable RLS for sms_reminders_queue
ALTER TABLE sms_reminders_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for sms_reminders_queue
CREATE POLICY "Admins can manage all SMS reminders"
  ON sms_reminders_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create index for efficient querying of pending reminders
CREATE INDEX idx_sms_reminders_queue_pending 
  ON sms_reminders_queue (send_at, status) 
  WHERE status = 'pending';

-- Create index for booking_id lookups
CREATE INDEX idx_sms_reminders_queue_booking_id 
  ON sms_reminders_queue (booking_id);