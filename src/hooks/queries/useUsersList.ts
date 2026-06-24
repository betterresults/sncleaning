import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUsersList, type UserListType } from '@/api/users';
import { queryKeys } from '@/lib/queryKeys';

export function useUsersList(userType: UserListType) {
  return useQuery({
    queryKey: queryKeys.users.list(userType),
    queryFn: () => fetchUsersList(userType),
  });
}

export function useInvalidateUsersList() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
}
