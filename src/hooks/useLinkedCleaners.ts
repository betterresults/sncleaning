import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cleanerOffersService } from '@/hooks/useCleanerServiceTypes';
import { cleanerCoversArea } from '@/hooks/useCoverageAreas';
import {
  cleanerCoversTime,
  type BookingTimeWindow,
  type WorkingHourBlock,
} from '@/lib/cleanerAvailabilityMatch';

export interface LinkedCleaner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  hourly_rate: number | null;
  presentage_rate: number | null;
  /** Configured service_type keys for this cleaner. Empty = no restriction configured (offers everything). */
  serviceTypeKeys: string[];
  /** Whether this cleaner is qualified for the `serviceType` passed into the hook (always true if none was passed). */
  offersService: boolean;
  /** Configured coverage borough_ids for this cleaner. Empty = no restriction configured (covers everywhere). */
  coverageAreaIds: string[];
  /** Whether this cleaner covers the `boroughId` passed into the hook (always true if none was passed/resolved). */
  coversArea: boolean;
  /** Configured weekly working-hour blocks for this cleaner. Empty = no restriction configured (always available). */
  workingHours: WorkingHourBlock[];
  /** Whether this cleaner's working hours cover the `bookingTimeWindow` passed into the hook (always true if none was passed). Unlike service/area, this is enforced as a hard block in assignment UIs. */
  coversTime: boolean;
  /** Whether this cleaner brings their own cleaning equipment. A simple toggle for now (no equipment-type breakdown). */
  hasEquipment: boolean;
  /** Whether this cleaner meets the `requiresEquipment` flag passed into the hook (always true if not passed/false). Soft signal, same treatment as service/area. */
  meetsEquipment: boolean;
}

/**
 * Hook to fetch cleaners that have linked auth user profiles.
 * This ensures consistency with the Users page Cleaners tab.
 *
 * Pass `serviceType` (a company_settings service_type key, e.g. the booking's
 * service_type) to compute `offersService` per cleaner, and `boroughId` (the
 * booking's postcode resolved to a coverage borough) to compute `coversArea`.
 * Cleaners are sorted so those matching both signals come first. Both are soft
 * signals only — nothing is filtered out.
 *
 * Pass `bookingTimeWindow` (the booking's day-of-week + start/end minutes) to
 * compute `coversTime`. Unlike service/area, callers should treat `coversTime`
 * as a hard block — a cleaner whose working hours don't cover the job's time
 * range shouldn't be assignable to it.
 *
 * Pass `requiresEquipment` (true if the booking needs the cleaner to bring their
 * own equipment) to compute `meetsEquipment`. Soft signal only, same as
 * service/area — nothing is filtered out.
 */
export const useLinkedCleaners = (
  enabled: boolean = true,
  serviceType?: string | null,
  boroughId?: string | null,
  bookingTimeWindow?: BookingTimeWindow | null,
  requiresEquipment?: boolean | null
) => {
  const [cleaners, setCleaners] = useState<LinkedCleaner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCleaners = async () => {
    try {
      setLoading(true);
      setError(null);

      // Uses a SECURITY DEFINER RPC (rather than querying profiles/cleaners/etc.
      // directly) so this hook works the same for every caller — admins and sales
      // agents get real pay rates, everyone else (customers booking their own job)
      // still gets the full cleaner list with rates omitted. Direct table queries
      // are locked down by RLS to admins/sales agents/the cleaner's own row, which
      // silently returned zero cleaners for customers.
      const { data, error: rpcError } = await supabase.rpc('get_assignable_cleaners');

      if (rpcError) {
        console.error('Error fetching assignable cleaners:', rpcError);
        throw rpcError;
      }

      const enriched: LinkedCleaner[] = (data || []).map((c) => {
        const serviceTypeKeys = c.service_type_keys || [];
        const coverageAreaIds = c.coverage_area_ids || [];
        const workingHours = (c.working_hours || []) as unknown as WorkingHourBlock[];
        return {
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          full_name: c.full_name,
          hourly_rate: c.hourly_rate,
          presentage_rate: c.presentage_rate,
          serviceTypeKeys,
          offersService: cleanerOffersService(serviceTypeKeys, serviceType),
          coverageAreaIds,
          coversArea: cleanerCoversArea(coverageAreaIds, boroughId),
          workingHours,
          coversTime: cleanerCoversTime(workingHours, bookingTimeWindow ?? null),
          hasEquipment: c.has_equipment ?? true,
          meetsEquipment: !requiresEquipment || (c.has_equipment ?? true),
        };
      });

      // Soft filter for service/area/equipment: keep everyone, just surface the
      // best-matching cleaners first. Time is weighted the same way for sorting
      // purposes, but callers should still treat coversTime as a hard block on selection.
      enriched.sort(
        (a, b) =>
          Number(b.offersService) + Number(b.coversArea) + Number(b.coversTime) + Number(b.meetsEquipment) -
          (Number(a.offersService) + Number(a.coversArea) + Number(a.coversTime) + Number(a.meetsEquipment))
      );

      setCleaners(enriched);
    } catch (err: any) {
      console.error('Error in useLinkedCleaners:', err);
      setError(err.message || 'Failed to fetch cleaners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchCleaners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, serviceType, boroughId, bookingTimeWindow?.dayOfWeek, bookingTimeWindow?.startMinutes, bookingTimeWindow?.endMinutes, requiresEquipment]);

  return { cleaners, loading, error, refetch: fetchCleaners };
};
