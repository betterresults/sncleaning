import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeServiceTypeKey } from '@/hooks/useCleanerServiceTypes';
import { useServiceTypes } from '@/hooks/useCompanySettings';
import { isAreaUnverified, resolvePostcodeToBorough } from '@/lib/postcodeCoverage';
import { getLondonWallClockDate } from '@/lib/ukTime';
import {
  enrichAssignableCleanerCatalogEntry,
  type AssignableCleanerCatalogEntry,
} from '@/lib/customerSlotAvailability';

export const assignableCleanersCatalogQueryKey = ['assignable-cleaners-catalog'];

/**
 * Fetches the assignable-cleaner catalog once (working hours, coverage, Google busy
 * blocks) so ScheduleStep can evaluate many slot windows client-side without
 * re-hitting the RPC per hour.
 */
export const useAssignableCleanersCatalog = (
  enabled = true,
  serviceTypeLabel?: string | null,
  postcode?: string | null
) => {
  const { data: serviceTypes = [] } = useServiceTypes();
  const serviceTypeKey = normalizeServiceTypeKey(serviceTypeLabel, serviceTypes);
  const [boroughId, setBoroughId] = useState<string | null>(null);
  const [areaUnverified, setAreaUnverified] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      resolvePostcodeToBorough(postcode).then((resolved) => {
        setBoroughId(resolved?.boroughId ?? null);
        setAreaUnverified(isAreaUnverified(postcode, resolved));
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [postcode]);

  const query = useQuery({
    queryKey: assignableCleanersCatalogQueryKey,
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_assignable_cleaners');
      if (error) throw error;
      return data || [];
    },
  });

  const cleaners: AssignableCleanerCatalogEntry[] = useMemo(() => {
    const pad2 = (value: number) => String(value).padStart(2, '0');
    const toCalendarBusyBlock = (block: { starts_at: string; ends_at: string; is_all_day?: boolean }) => {
      const start = getLondonWallClockDate(block.starts_at);
      const end = getLondonWallClockDate(block.ends_at);
      if (!start || !end || end <= start) return null;

      return {
        dateKey: `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`,
        startMinutes: block.is_all_day ? 0 : start.getHours() * 60 + start.getMinutes(),
        endMinutes: block.is_all_day ? 24 * 60 : end.getHours() * 60 + end.getMinutes(),
        isAllDay: block.is_all_day,
      };
    };

    return (query.data || []).map((row) =>
      enrichAssignableCleanerCatalogEntry(row, serviceTypeKey, boroughId, toCalendarBusyBlock)
    );
  }, [query.data, serviceTypeKey, boroughId]);

  return {
    cleaners,
    loading: query.isLoading,
    error: query.error,
    serviceTypeKey,
    boroughId,
    areaUnverified,
    refetch: query.refetch,
  };
};
