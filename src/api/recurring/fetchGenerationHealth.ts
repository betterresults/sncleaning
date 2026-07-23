import { supabase } from '@/integrations/supabase/client';
import type { RecurringGenerationHealth } from './types';

export async function fetchRecurringGenerationHealth(): Promise<RecurringGenerationHealth> {
  const { data, error } = await supabase.rpc('get_recurring_generation_health');
  if (error) throw error;

  const payload = (data ?? {}) as unknown as RecurringGenerationHealth;
  return {
    active_series: Number(payload.active_series ?? 0),
    gap_count: Number(payload.gap_count ?? 0),
    gaps: Array.isArray(payload.gaps) ? payload.gaps : [],
    last_run: payload.last_run ?? null,
  };
}
