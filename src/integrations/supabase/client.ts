import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://dkomihipebixlegygnoy.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb21paGlwZWJpeGxlZ3lnbm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MDEwNTMsImV4cCI6MjA0NjA3NzA1M30.z4hlXMnyyleo4sWyPnFuKFC5-tkQw4lVcDiF8TRWla4';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
