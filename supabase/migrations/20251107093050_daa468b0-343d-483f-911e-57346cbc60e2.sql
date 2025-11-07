-- Create photo processing status tracking table
CREATE TABLE IF NOT EXISTS public.photo_processing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_photo_processing_booking ON public.photo_processing_status(booking_id);
CREATE INDEX IF NOT EXISTS idx_photo_processing_status ON public.photo_processing_status(status);

-- Enable RLS
ALTER TABLE public.photo_processing_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view their processing status"
  ON public.photo_processing_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert processing status"
  ON public.photo_processing_status
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service role to update processing status"
  ON public.photo_processing_status
  FOR UPDATE
  TO service_role
  USING (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_photo_processing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_processing_updated_at
  BEFORE UPDATE ON public.photo_processing_status
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_processing_updated_at();