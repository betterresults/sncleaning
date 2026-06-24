ALTER TABLE public.quote_leads REPLICA IDENTITY FULL;
ALTER TABLE public.funnel_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;