-- Add columns to quote_leads for admin-created pending bookings
ALTER TABLE quote_leads 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website',
ADD COLUMN IF NOT EXISTS confirmation_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID,
ADD COLUMN IF NOT EXISTS converted_booking_id BIGINT;

-- Create unique index on confirmation_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_leads_confirmation_token ON quote_leads(confirmation_token);

-- Add index for admin-created leads
CREATE INDEX IF NOT EXISTS idx_quote_leads_source ON quote_leads(source);

-- Add comment for clarity
COMMENT ON COLUMN quote_leads.source IS 'Source of the lead: website, admin, etc.';
COMMENT ON COLUMN quote_leads.confirmation_token IS 'Unique token for customer confirmation link';
COMMENT ON COLUMN quote_leads.confirmation_sent_at IS 'When the confirmation link was sent to customer';
COMMENT ON COLUMN quote_leads.confirmed_at IS 'When the customer confirmed and completed the booking';
COMMENT ON COLUMN quote_leads.expires_at IS 'When the confirmation link expires';
COMMENT ON COLUMN quote_leads.created_by_admin_id IS 'Admin user who created this lead';
COMMENT ON COLUMN quote_leads.converted_booking_id IS 'The booking ID after confirmation';