-- Reconcile-loop hardening: raise the pg_net response timeout on the two Google
-- Calendar cron jobs from 10s to 60s.
--
-- The timeout only governs how long pg_net waits to capture the HTTP response; the
-- Edge Function keeps running server-side regardless. At 10s, once the reconcile
-- loop takes longer than 10s (as connected-cleaner count grows) pg_net records a
-- false "timeout" in net._http_response and loses the real status/body, hurting
-- observability. 60s gives comfortable headroom without changing sync behavior.
--
-- Idempotent: looks up the existing jobs by name and only rewrites their command.

DO $$
DECLARE
  jid BIGINT;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'google-calendar-auto-sync';
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, command := $cmd$
    select net.http_post(
      url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/google-calendar-webhook',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('source', 'cron', 'scheduled_at', now()),
      timeout_milliseconds := 60000
    ) as request_id;
  $cmd$);
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'google-calendar-booking-auto-sync';
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, command := $cmd$
    select net.http_post(
      url := 'https://dkomihipebixlegygnoy.supabase.co/functions/v1/sync-assigned-bookings-to-google-calendar',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('source', 'cron', 'scheduled_at', now()),
      timeout_milliseconds := 60000
    ) as request_id;
  $cmd$);
  END IF;
END $$;
