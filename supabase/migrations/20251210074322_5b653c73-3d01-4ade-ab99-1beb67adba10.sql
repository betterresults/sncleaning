-- Create a simple funnel events table for tracking user journey
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'service_click', 'form_started', etc.
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for anonymous users)
CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view all events
CREATE POLICY "Admins can view all funnel events"
  ON public.funnel_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_funnel_events_session ON public.funnel_events(session_id);
CREATE INDEX idx_funnel_events_type ON public.funnel_events(event_type);
CREATE INDEX idx_funnel_events_created ON public.funnel_events(created_at DESC);