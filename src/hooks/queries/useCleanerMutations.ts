import { useMutation } from '@tanstack/react-query';
import {
  createCleanerRecord,
  deleteCleanerRecord,
  updateCleanerRecord,
  type CreateCleanerInput,
  type UpdateCleanerInput,
} from '@/api/cleaners';
import { allCleanerCoverageAreasQueryKey } from '@/hooks/useCoverageAreas';
import { allCleanerServiceTypesQueryKey } from '@/hooks/useCleanerServiceTypes';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

export function useCleanerMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cleaners.all });
    queryClient.invalidateQueries({ queryKey: allCleanerServiceTypesQueryKey });
    queryClient.invalidateQueries({ queryKey: allCleanerCoverageAreasQueryKey });
  };

  const updateCleaner = useMutation({
    mutationFn: (input: UpdateCleanerInput) => updateCleanerRecord(input),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Success', description: 'Cleaner updated successfully!' });
    },
    onError: (error: Error) => {
      console.error('Error updating cleaner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update cleaner',
        variant: 'destructive',
      });
    },
  });

  const deleteCleaner = useMutation({
    mutationFn: (cleanerId: number) => deleteCleanerRecord(cleanerId),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Success', description: 'Cleaner deleted successfully!' });
    },
    onError: (error: Error) => {
      console.error('Error deleting cleaner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete cleaner',
        variant: 'destructive',
      });
    },
  });

  const createCleaner = useMutation({
    mutationFn: (input: CreateCleanerInput) => createCleanerRecord(input),
    onSuccess: (result, variables) => {
      invalidate();
      if (variables.password && !result.accountCreated) {
        toast({
          title: 'Cleaner saved — login not created',
          description:
            'The cleaner profile was created, but the login account failed. Use Create Account on their card to try again.',
          variant: 'destructive',
        });
        return;
      }
      if (variables.password && result.accountCreated) {
        toast({
          title: 'Success',
          description: 'Cleaner and login account created successfully!',
        });
        return;
      }
      toast({ title: 'Success', description: 'Cleaner created successfully!' });
    },
    onError: (error: Error) => {
      console.error('Error creating cleaner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create cleaner',
        variant: 'destructive',
      });
    },
  });

  return { updateCleaner, deleteCleaner, createCleaner };
}
