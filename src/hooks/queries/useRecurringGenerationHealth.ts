import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchRecurringGenerationHealth,
  runRecurringGenerationNow,
} from '@/api/recurring';
import { toast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryKeys';

export function useRecurringGenerationHealth() {
  return useQuery({
    queryKey: queryKeys.recurring.health,
    queryFn: fetchRecurringGenerationHealth,
    refetchInterval: 60_000,
  });
}

export function useRunRecurringGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runRecurringGenerationNow,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.recurring.health });

      const parts = [
        `Processed ${result.services_processed} series`,
        `created ${result.bookings_created}`,
        `skipped ${result.bookings_skipped}`,
      ];
      if (result.services_with_errors > 0) {
        parts.push(`${result.services_with_errors} with errors`);
      }

      toast({
        title: result.services_with_errors > 0 ? 'Generation finished with errors' : 'Generation complete',
        description: parts.join(' · '),
        variant: result.services_with_errors > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation failed',
        description: error.message || 'Could not run recurring generation',
        variant: 'destructive',
      });
    },
  });
}
