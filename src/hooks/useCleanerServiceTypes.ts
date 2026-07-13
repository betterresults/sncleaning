import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ServiceType } from '@/hooks/useCompanySettings';
import { saveCleanerServiceTypes } from '@/api/cleaners/mutations';

export const cleanerServiceTypesQueryKey = (cleanerId: number | null) => ['cleaner-service-types', cleanerId];
export const allCleanerServiceTypesQueryKey = ['cleaner-service-types', 'all'];

// A cleaner with zero rows here has "no restriction configured" — every booking
// assignment/available-bookings flow treats that as offering every service, so
// nothing breaks until an admin explicitly curates a cleaner's capabilities.
export const useCleanerServiceTypes = (cleanerId: number | null) => {
  return useQuery({
    queryKey: cleanerServiceTypesQueryKey(cleanerId),
    enabled: !!cleanerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaner_service_types')
        .select('service_type_key')
        .eq('cleaner_id', cleanerId as number);

      if (error) throw error;
      return (data || []).map((row) => row.service_type_key);
    },
  });
};

// Bulk fetch for admin list views that render many cleaners at once (avoids N+1 queries).
export const useAllCleanerServiceTypes = () => {
  return useQuery({
    queryKey: allCleanerServiceTypesQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaner_service_types')
        .select('cleaner_id, service_type_key');

      if (error) throw error;

      const map = new Map<number, string[]>();
      (data || []).forEach((row) => {
        const existing = map.get(row.cleaner_id) || [];
        existing.push(row.service_type_key);
        map.set(row.cleaner_id, existing);
      });
      return map;
    },
  });
};

// Diff-based replace so a failed insert cannot wipe existing services.
export const useSaveCleanerServiceTypes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cleanerId, serviceTypeKeys }: { cleanerId: number; serviceTypeKeys: string[] }) => {
      await saveCleanerServiceTypes(cleanerId, serviceTypeKeys);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cleanerServiceTypesQueryKey(variables.cleanerId) });
      queryClient.invalidateQueries({ queryKey: allCleanerServiceTypesQueryKey });
      queryClient.invalidateQueries({ queryKey: ['linked-cleaners'] });
      toast.success('Services updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update services');
    },
  });
};

// True when a cleaner is qualified for the given service: either the cleaner has no
// configured services (unrestricted wildcard) or the key is explicitly in their list.
export const cleanerOffersService = (configuredKeys: string[], serviceTypeKey?: string | null) => {
  if (!serviceTypeKey) return true;
  if (configuredKeys.length === 0) return true;
  return configuredKeys.includes(serviceTypeKey);
};

// `bookings.service_type` has historically been stored inconsistently — sometimes a
// canonical company_settings key ("airbnb"), sometimes a display label ("Domestic
// Cleaning", "Standard Cleaning", "Domestic"). Normalize to the canonical key so
// cleaner-service matching works regardless of which form a given row has.
export const normalizeServiceTypeKey = (
  raw: string | null | undefined,
  serviceTypes: ServiceType[]
): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const byKey = serviceTypes.find((st) => st.key.toLowerCase() === lower);
  if (byKey) return byKey.key;

  const byLabel = serviceTypes.find((st) => st.label.toLowerCase() === lower);
  if (byLabel) return byLabel.key;

  // Loose match: "Domestic" should match "Domestic Cleaning", "Standard Cleaning"
  // should match a key literally named "standard_cleaning", etc.
  const byPartial = serviceTypes.find((st) => {
    const label = st.label.toLowerCase();
    const labelWithoutCleaning = label.replace(/\s*cleaning\s*$/, '').trim();
    return (
      label.startsWith(lower) ||
      lower.startsWith(labelWithoutCleaning) ||
      st.key.replace(/_/g, ' ') === lower
    );
  });
  if (byPartial) return byPartial.key;

  return lower;
};
