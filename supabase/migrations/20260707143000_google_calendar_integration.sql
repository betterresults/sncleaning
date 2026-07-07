-- Google Calendar integration for cleaner availability.
-- Cleaner weekly hours remain the recurring template; Google events are date-specific
-- busy blocks layered on top of that template.

CREATE TABLE IF NOT EXISTS public.cleaner_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  google_calendar_id TEXT NOT NULL DEFAULT 'primary',
  google_calendar_email TEXT,
  access_token_ciphertext TEXT,
  refresh_token_ciphertext TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  sync_token TEXT,
  channel_id TEXT,
  channel_resource_id TEXT,
  channel_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'connected',
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cleaner_calendar_connections_provider_check CHECK (provider IN ('google')),
  CONSTRAINT cleaner_calendar_connections_status_check CHECK (status IN ('connected', 'disconnected', 'error'))
);

CREATE UNIQUE INDEX IF NOT EXISTS cleaner_calendar_connections_cleaner_provider_idx
  ON public.cleaner_calendar_connections(cleaner_id, provider);

CREATE TABLE IF NOT EXISTS public.cleaner_calendar_busy_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.cleaner_calendar_connections(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  google_event_etag TEXT,
  summary TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  transparency TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cleaner_calendar_busy_blocks_time_check CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS cleaner_calendar_busy_blocks_connection_event_idx
  ON public.cleaner_calendar_busy_blocks(connection_id, google_event_id);

CREATE INDEX IF NOT EXISTS cleaner_calendar_busy_blocks_cleaner_range_idx
  ON public.cleaner_calendar_busy_blocks(cleaner_id, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS public.booking_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  cleaner_id BIGINT NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.cleaner_calendar_connections(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  google_event_link TEXT,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS booking_calendar_events_booking_cleaner_idx
  ON public.booking_calendar_events(booking_id, cleaner_id);

CREATE OR REPLACE FUNCTION public.update_calendar_integration_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_cleaner_calendar_connections_updated_at ON public.cleaner_calendar_connections;
CREATE TRIGGER update_cleaner_calendar_connections_updated_at
  BEFORE UPDATE ON public.cleaner_calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_integration_updated_at();

DROP TRIGGER IF EXISTS update_cleaner_calendar_busy_blocks_updated_at ON public.cleaner_calendar_busy_blocks;
CREATE TRIGGER update_cleaner_calendar_busy_blocks_updated_at
  BEFORE UPDATE ON public.cleaner_calendar_busy_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_integration_updated_at();

DROP TRIGGER IF EXISTS update_booking_calendar_events_updated_at ON public.booking_calendar_events;
CREATE TRIGGER update_booking_calendar_events_updated_at
  BEFORE UPDATE ON public.booking_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_integration_updated_at();

ALTER TABLE public.cleaner_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaner_calendar_busy_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cleaner calendar connections"
  ON public.cleaner_calendar_connections
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cleaners can view their own calendar connection"
  ON public.cleaner_calendar_connections
  FOR SELECT
  USING (
    cleaner_id IN (
      SELECT profiles.cleaner_id
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage cleaner calendar busy blocks"
  ON public.cleaner_calendar_busy_blocks
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cleaners can view their own calendar busy blocks"
  ON public.cleaner_calendar_busy_blocks
  FOR SELECT
  USING (
    cleaner_id IN (
      SELECT profiles.cleaner_id
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage booking calendar events"
  ON public.booking_calendar_events
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cleaners can view their own booking calendar events"
  ON public.booking_calendar_events
  FOR SELECT
  USING (
    cleaner_id IN (
      SELECT profiles.cleaner_id
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
    )
  );
