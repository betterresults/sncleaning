import { supabase } from '@/integrations/supabase/client';
import type { RecurringSeriesGapRepairResult } from './types';

export async function repairRecurringSeriesGap(
  serviceId: number,
): Promise<RecurringSeriesGapRepairResult> {
  const { data, error } = await supabase.rpc('repair_recurring_series_gap', {
    p_service_id: serviceId,
  });
  if (error) throw error;

  const payload = (data ?? {}) as unknown as RecurringSeriesGapRepairResult;
  const generation = payload.generation ?? {
    run_id: 0,
    triggered_by: 'admin' as const,
    services_processed: 0,
    bookings_created: 0,
    bookings_skipped: 0,
    services_with_errors: 0,
    errors: [],
  };

  return {
    service_id: Number(payload.service_id ?? serviceId),
    was_created_until_before: payload.was_created_until_before ?? null,
    was_created_until_anchor: payload.was_created_until_anchor ?? null,
    was_created_until_after_reset: payload.was_created_until_after_reset ?? null,
    generation: {
      run_id: Number(generation.run_id ?? 0),
      triggered_by: generation.triggered_by ?? 'admin',
      services_processed: Number(generation.services_processed ?? 0),
      bookings_created: Number(generation.bookings_created ?? 0),
      bookings_skipped: Number(generation.bookings_skipped ?? 0),
      services_with_errors: Number(generation.services_with_errors ?? 0),
      errors: Array.isArray(generation.errors) ? generation.errors : [],
      service_id_filter:
        generation.service_id_filter == null
          ? null
          : Number(generation.service_id_filter),
    },
  };
}
