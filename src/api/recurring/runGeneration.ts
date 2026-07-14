import { supabase } from '@/integrations/supabase/client';
import type { RecurringGenerationRunResult } from './types';

export async function runRecurringGenerationNow(): Promise<RecurringGenerationRunResult> {
  const { data, error } = await supabase.rpc('run_recurring_generation_now');
  if (error) throw error;

  const payload = (data ?? {}) as RecurringGenerationRunResult;
  return {
    run_id: Number(payload.run_id ?? 0),
    triggered_by: payload.triggered_by ?? 'admin',
    services_processed: Number(payload.services_processed ?? 0),
    bookings_created: Number(payload.bookings_created ?? 0),
    bookings_skipped: Number(payload.bookings_skipped ?? 0),
    services_with_errors: Number(payload.services_with_errors ?? 0),
    errors: Array.isArray(payload.errors) ? payload.errors : [],
  };
}
