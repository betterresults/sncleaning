import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PostcodePrefixEntry } from '@/lib/postcodeCoverage';

export interface CoverageAreaOption {
  boroughId: string;
  label: string;
  displayOrder: number;
}

export const coverageAreaOptionsQueryKey = ['coverage-area-options'];
export const cleanerCoverageAreasQueryKey = (cleanerId: number | null) => ['cleaner-coverage-areas', cleanerId];
export const allCleanerCoverageAreasQueryKey = ['cleaner-coverage-areas', 'all'];
export const postcodePrefixIndexQueryKey = ['postcode-prefix-index'];

// Fetches the full active postcode_prefixes list (with borough/region names) once, so
// list views can match many bookings' postcodes against it in-memory without a DB
// round-trip per row. There are only ~200 prefixes, so this is cheap to load in full.
export const usePostcodePrefixIndex = () => {
  return useQuery({
    queryKey: postcodePrefixIndexQueryKey,
    queryFn: async (): Promise<PostcodePrefixEntry[]> => {
      const { data, error } = await supabase
        .from('postcode_prefixes')
        .select('prefix, borough_id, coverage_boroughs ( name, coverage_regions ( name ) )')
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        prefix: row.prefix,
        boroughId: row.borough_id,
        boroughName: row.coverage_boroughs?.name ?? 'Unknown',
        regionName: row.coverage_boroughs?.coverage_regions?.name ?? 'Unknown',
      }));
    },
  });
};

// The pickable list of "areas" cleaners can cover. In practice every coverage_region has
// exactly one coverage_borough child (named "General"), so the region name alone is the
// meaningful label; we only append the borough name if it's ever something else.
export const useCoverageAreaOptions = () => {
  return useQuery({
    queryKey: coverageAreaOptionsQueryKey,
    queryFn: async (): Promise<CoverageAreaOption[]> => {
      const { data, error } = await supabase
        .from('coverage_boroughs')
        .select('id, name, display_order, is_active, coverage_regions ( name, display_order, is_active )')
        .eq('is_active', true);

      if (error) throw error;

      return (data || [])
        .filter((row: any) => row.coverage_regions?.is_active !== false)
        .map((row: any) => ({
          boroughId: row.id as string,
          label: row.name === 'General' ? row.coverage_regions?.name ?? row.name : `${row.coverage_regions?.name} – ${row.name}`,
          displayOrder: row.coverage_regions?.display_order ?? 0,
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));
    },
  });
};

// A cleaner with zero rows here has "no restriction configured" — every matching flow
// treats that as covering every area until an admin/cleaner explicitly curates it.
export const useCleanerCoverageAreas = (cleanerId: number | null) => {
  return useQuery({
    queryKey: cleanerCoverageAreasQueryKey(cleanerId),
    enabled: !!cleanerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaner_coverage_areas')
        .select('borough_id')
        .eq('cleaner_id', cleanerId as number);

      if (error) throw error;
      return (data || []).map((row) => row.borough_id);
    },
  });
};

// Bulk fetch for admin list views that render many cleaners at once (avoids N+1 queries).
export const useAllCleanerCoverageAreas = () => {
  return useQuery({
    queryKey: allCleanerCoverageAreasQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cleaner_coverage_areas')
        .select('cleaner_id, borough_id');

      if (error) throw error;

      const map = new Map<number, string[]>();
      (data || []).forEach((row) => {
        const existing = map.get(row.cleaner_id) || [];
        existing.push(row.borough_id);
        map.set(row.cleaner_id, existing);
      });
      return map;
    },
  });
};

// Replaces a cleaner's entire set of configured coverage areas in one go.
export const useSaveCleanerCoverageAreas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cleanerId, boroughIds }: { cleanerId: number; boroughIds: string[] }) => {
      const { error: deleteError } = await supabase
        .from('cleaner_coverage_areas')
        .delete()
        .eq('cleaner_id', cleanerId);
      if (deleteError) throw deleteError;

      if (boroughIds.length === 0) return;

      const rows = boroughIds.map((boroughId) => ({ cleaner_id: cleanerId, borough_id: boroughId }));
      const { error: insertError } = await supabase.from('cleaner_coverage_areas').insert(rows);
      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cleanerCoverageAreasQueryKey(variables.cleanerId) });
      queryClient.invalidateQueries({ queryKey: allCleanerCoverageAreasQueryKey });
      queryClient.invalidateQueries({ queryKey: ['linked-cleaners'] });
      toast.success('Coverage areas updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save coverage areas');
    },
  });
};

// True when a cleaner is considered to cover the given area: either the cleaner has no
// configured areas (unrestricted wildcard) or the given borough is unresolved (we don't
// know where the booking is, so we don't penalize anyone), or the borough is explicitly
// in their list.
export const cleanerCoversArea = (configuredBoroughIds: string[], boroughId?: string | null): boolean => {
  if (!boroughId) return true;
  if (configuredBoroughIds.length === 0) return true;
  return configuredBoroughIds.includes(boroughId);
};
