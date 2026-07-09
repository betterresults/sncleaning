import { useMutation } from '@tanstack/react-query';
import {
  addUser,
  bulkUpdateCustomers,
  changeUserRole,
  deleteUserAccount,
  resetUserPassword,
  updateUserAdmin,
  type AddUserInput,
  type BulkUpdateCustomersInput,
  type ChangeUserRoleInput,
  type UpdateUserAdminInput,
} from '@/api/users';
import { useToast } from '@/hooks/use-toast';
import type { UserListType } from '@/api/users';

export function useUserMutations(userType: UserListType, onRefresh: () => void) {
  const { toast } = useToast();

  const addUserMutation = useMutation({
    mutationFn: (input: AddUserInput) => addUser(input),
  });

  const changeUserRoleMutation = useMutation({
    mutationFn: (input: ChangeUserRoleInput) => changeUserRole(input),
    onSuccess: (result) => {
      if (result.status === 'profile_not_found') {
        toast({
          title: 'Profile Not Found',
          description:
            'The user exists in authentication but has no profile. Please delete the orphaned user from Supabase Auth and try again.',
          variant: 'destructive',
        });
        return;
      }
      if (result.status === 'error') {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Success',
        description: `User role updated to ${result.roleDisplay}`,
      });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUserAccount(userId),
    onSuccess: () => {
      toast({ title: 'Success', description: 'User deleted successfully' });
      onRefresh();
    },
    onError: (error: Error) => {
      console.error('Error deleting user:', error);
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    },
  });

  const passwordResetMutation = useMutation({
    mutationFn: ({ email }: { email: string; userId: string }) => resetUserPassword(email),
    onSuccess: (_, { email }) => {
      toast({
        title: 'Password Reset Email Sent',
        description: `Reset link sent to ${email}`,
      });
    },
    onError: (error: Error) => {
      console.error('Error sending password reset:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (input: UpdateUserAdminInput) => updateUserAdmin(input),
    onSuccess: (_, { editData }) => {
      toast({
        title: 'Success',
        description: editData.password ? 'User details and password updated!' : 'User details updated!',
      });
      onRefresh();
    },
    onError: (error: Error) => {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (input: BulkUpdateCustomersInput) => bulkUpdateCustomers(input),
    onSuccess: (count) => {
      toast({ title: 'Updated', description: `Updated ${count} customers` });
      onRefresh();
    },
    onError: (error: Error) => {
      if (error.message === 'NOTHING_TO_UPDATE') {
        toast({
          title: 'Nothing to update',
          description: 'Choose Type or Source to apply',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Error', description: error.message || 'Bulk update failed', variant: 'destructive' });
    },
  });

  return {
    addUserMutation,
    changeUserRoleMutation,
    deleteUserMutation,
    passwordResetMutation,
    updateUserMutation,
    bulkUpdateMutation,
  };
}
