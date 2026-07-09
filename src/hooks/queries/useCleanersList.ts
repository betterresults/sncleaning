import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCleanersList } from '@/api/cleaners';
import { queryKeys } from '@/lib/queryKeys';

export function useCleanersList() {
  return useQuery({
    queryKey: queryKeys.cleaners.list,
    queryFn: fetchCleanersList,
  });
}

export function useInvalidateCleanersList() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.cleaners.all });
}
