-- Fix RLS issues by enabling RLS on tables that don't have it
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Enable RLS on all public tables that don't have it
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.tablename 
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        WHERE t.schemaname = 'public' 
        AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL)
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;