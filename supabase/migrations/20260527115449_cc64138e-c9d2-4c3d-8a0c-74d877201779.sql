GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.quote_requests TO anon;
GRANT INSERT ON public.quote_requests TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'quote_requests'
      AND policyname = 'Anyone can submit quote requests'
  ) THEN
    CREATE POLICY "Anyone can submit quote requests"
    ON public.quote_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
  END IF;
END $$;