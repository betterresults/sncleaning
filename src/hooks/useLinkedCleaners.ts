import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cleanerOffersService } from '@/hooks/useCleanerServiceTypes';

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
}

/**
 * Hook to fetch cleaners that have linked auth user profiles.
 * This ensures consistency with the Users page Cleaners tab.
 *
 * Pass `serviceType` (a company_settings service_type key, e.g. the booking's
 * service_type) to compute `offersService` per cleaner and to sort qualified
 * cleaners first. This is a soft signal only — nothing is filtered out.
 */
export const useLinkedCleaners = (enabled: boolean = true, serviceType?: string | null) => {
  const [cleaners, setCleaners] = useState<LinkedCleaner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCleaners = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get all cleaner IDs that are linked to profiles
      const { data: linkedProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('cleaner_id')
        .not('cleaner_id', 'is', null);

      if (profileError) {
        console.error('Error fetching linked profiles:', profileError);
        throw profileError;
      }

      const linkedCleanerIds = linkedProfiles?.map(p => p.cleaner_id).filter(Boolean) || [];

      if (linkedCleanerIds.length === 0) {
        setCleaners([]);
        return;
      }

      // Now fetch cleaners that are in the linked list
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, first_name, last_name, full_name, hourly_rate, presentage_rate')
        .in('id', linkedCleanerIds)
        .order('first_name');

      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
        throw cleanersError;
      }

      const { data: serviceRows, error: serviceError } = await supabase
        .from('cleaner_service_types')
        .select('cleaner_id, service_type_key')
        .in('cleaner_id', linkedCleanerIds);

      if (serviceError) {
        console.error('Error fetching cleaner service types:', serviceError);
        throw serviceError;
      }

      const serviceMap = new Map<number, string[]>();
      (serviceRows || []).forEach((row) => {
        const existing = serviceMap.get(row.cleaner_id) || [];
        existing.push(row.service_type_key);
        serviceMap.set(row.cleaner_id, existing);
      });

      const enriched: LinkedCleaner[] = (cleanersData || []).map((c) => {
        const serviceTypeKeys = serviceMap.get(c.id) || [];
        return {
          ...c,
          serviceTypeKeys,
          offersService: cleanerOffersService(serviceTypeKeys, serviceType),
        };
      });

      // Soft filter: keep everyone, just surface qualified cleaners first.
      enriched.sort((a, b) => Number(b.offersService) - Number(a.offersService));

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
  }, [enabled, serviceType]);

  return { cleaners, loading, error, refetch: fetchCleaners };
};
