import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LinkedCleaner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  hourly_rate: number | null;
  presentage_rate: number | null;
}

/**
 * Hook to fetch cleaners that have linked auth user profiles.
 * This ensures consistency with the Users page Cleaners tab.
 */
export const useLinkedCleaners = (enabled: boolean = true) => {
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

      setCleaners(cleanersData || []);
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
  }, [enabled]);

  return { cleaners, loading, error, refetch: fetchCleaners };
};
