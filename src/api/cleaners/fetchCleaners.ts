import { supabase } from '@/integrations/supabase/client';
import type { CleanerData } from './types';

export async function fetchCleanersList(): Promise<CleanerData[]> {
  const { data: cleaners, error } = await supabase
    .from('cleaners')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;

  const processedCleaners = await Promise.all(
    (cleaners || []).map(async (cleaner) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('cleaner_id', cleaner.id)
        .single();

      return {
        ...cleaner,
        has_account: !!profile,
      } as CleanerData;
    })
  );

  return processedCleaners;
}
