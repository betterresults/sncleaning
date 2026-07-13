import { useEffect, useMemo, useState } from 'react';
import { useUsersList, useInvalidateUsersList } from '@/hooks/queries/useUsersList';
import { useUserMutations } from '@/hooks/queries/useUserMutations';
import { useToast } from '@/hooks/use-toast';
import { useCustomerPaymentMethods } from '@/hooks/useCustomerPaymentMethods';
import {
  applyUsersListFilters,
  createEmptyNewUserForm,
  getUniqueCustomerTypes,
  type AddressFilter,
  type ModernUsersTableProps,
  type NewUserFormData,
  type UserData,
  type UsersTableRowHandlers,
  type UsersTableUserType,
} from '@/components/users/list';

/** Stable empty list — inline `= []` creates a new reference every render and can infinite-loop effects. */
const EMPTY_USERS: UserData[] = [];

export function useModernUsersTable({
  userType = 'all',
  openCustomerId,
}: ModernUsersTableProps) {
  const { data, isLoading: loading, error: usersError } = useUsersList(userType);
  const users = data ?? EMPTY_USERS;
  const invalidateUsersList = useInvalidateUsersList();
  const refreshUsers = () => invalidateUsersList();
  const { toast } = useToast();

  const {
    addUserMutation,
    changeUserRoleMutation,
    deleteUserMutation,
    passwordResetMutation,
    updateUserMutation,
    bulkUpdateMutation,
  } = useUserMutations(userType, refreshUsers);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [addressFilter, setAddressFilter] = useState<AddressFilter>('all');

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState<NewUserFormData>(() =>
    createEmptyNewUserForm(userType)
  );
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState('');

  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [collectPaymentDialogUser, setCollectPaymentDialogUser] = useState<UserData | null>(null);

  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<UserData | null>(
    null
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDirectPaymentDialog, setShowDirectPaymentDialog] = useState(false);

  const [customerDetailView, setCustomerDetailView] = useState<UserData | null>(null);

  const [assignSourcesDialogOpen, setAssignSourcesDialogOpen] = useState(false);
  const [selectedAgentForSources, setSelectedAgentForSources] = useState<UserData | null>(null);

  const customerIds = useMemo(
    () =>
      users
        .filter((user) => user.type === 'business_customer' && user.business_id)
        .map((user) => Number(user.business_id!)),
    [users]
  );

  const { paymentData, refetch: refetchPaymentData } = useCustomerPaymentMethods(customerIds);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<number[]>([]);
  const [bulkType, setBulkType] = useState<string | 'no-change' | 'empty'>('no-change');
  const [bulkSource, setBulkSource] = useState<string | 'no-change' | 'empty'>('no-change');

  const uniqueCustomerTypes = useMemo(() => getUniqueCustomerTypes(users), [users]);
  const isCustomerView = userType === 'customer';
  const showBulkEdit = isCustomerView && selectedBusinessIds.length > 0;

  const filteredUsers = useMemo(
    () => applyUsersListFilters(users, searchTerm, userType, customerTypeFilter, addressFilter),
    [users, searchTerm, userType, customerTypeFilter, addressFilter]
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  useEffect(() => {
    if (!openCustomerId || loading) return;
    const user = users.find(
      (u) => u.business_id === openCustomerId || Number(u.id) === openCustomerId
    );
    if (user) setCustomerDetailView(user);
  }, [openCustomerId, loading, users]);

  useEffect(() => {
    if (usersError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data: ' + usersError.message,
        variant: 'destructive',
      });
    }
  }, [usersError, toast]);

  const handleAddUser = async () => {
    if (!newUserData.first_name || !newUserData.last_name || !newUserData.email) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await addUserMutation.mutateAsync({
        email: newUserData.email,
        firstName: newUserData.first_name,
        lastName: newUserData.last_name,
        phone: newUserData.phone || undefined,
        role: newUserData.role,
        userType,
      });

      if (result.status === 'email_exists') {
        setExistingUserEmail(newUserData.email);
        setShowAddUserForm(false);
        setShowRoleChangeDialog(true);
        return;
      }

      if (result.status === 'error') {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }

      toast({
        title: 'User Created Successfully',
        description: `An invitation email with login credentials has been sent to ${newUserData.email}`,
      });
      setShowAddUserForm(false);
      setNewUserData(createEmptyNewUserForm(userType));
      refreshUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleChangeUserRole = () => {
    changeUserRoleMutation.mutate(
      { email: existingUserEmail, role: newUserData.role },
      {
        onSuccess: (result) => {
          if (result.status === 'success') {
            setShowRoleChangeDialog(false);
            setNewUserData(createEmptyNewUserForm(userType));
            setExistingUserEmail('');
          } else if (result.status === 'profile_not_found') {
            setShowRoleChangeDialog(false);
          }
        },
      }
    );
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete.id, {
      onSuccess: () => setUserToDelete(null),
    });
  };

  const startEditing = (user: UserData) => {
    setEditingUser(user.id);
    setEditData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      role: user.role || 'guest',
      password: '',
      client_type: user.client_type ?? null,
      client_status: user.client_status || '',
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditData({});
    setShowPassword(false);
  };

  const updateUser = (userId: string) => {
    updateUserMutation.mutate(
      { userId, userType, users, editData },
      { onSuccess: cancelEditing }
    );
  };

  const handlePasswordReset = (email: string, userId: string) => {
    passwordResetMutation.mutate({ email, userId });
  };

  const isSelected = (id: string) => selectedIds.has(id);

  const toggleSelect = (user: UserData) => {
    if (user.type !== 'business_customer' || !user.business_id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(user.id)) next.delete(user.id);
      else next.add(user.id);
      return next;
    });
    setSelectedBusinessIds((prev) => {
      const exists = prev.includes(user.business_id!);
      if (exists) return prev.filter((v) => v !== user.business_id);
      return [...prev, user.business_id!];
    });
  };

  const toggleSelectAll = () => {
    const allBusiness = filteredUsers.filter((u) => u.type === 'business_customer' && u.business_id);
    const allIds = allBusiness.map((u) => u.id);
    const allBizIds = allBusiness.map((u) => u.business_id!) as number[];
    const allSelected = allIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
      setSelectedBusinessIds([]);
    } else {
      setSelectedIds(new Set(allIds));
      setSelectedBusinessIds(allBizIds);
    }
  };

  const applyBulkUpdate = () => {
    if (selectedBusinessIds.length === 0) return;
    bulkUpdateMutation.mutate(
      { businessIds: selectedBusinessIds, bulkType, bulkSource },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setSelectedBusinessIds([]);
          setBulkType('no-change');
          setBulkSource('no-change');
        },
      }
    );
  };

  const clearBulkSelection = () => {
    setSelectedIds(new Set());
    setSelectedBusinessIds([]);
  };

  const rowHandlers: UsersTableRowHandlers = {
    onUpdateUser: updateUser,
    onCancelEditing: cancelEditing,
    onToggleSelect: toggleSelect,
    onViewCustomerDetail: setCustomerDetailView,
    onStartEditing: startEditing,
    onCollectPayment: setCollectPaymentDialogUser,
    onPaymentMethodsClick: (user, paymentCount) => {
      setSelectedCustomerForPayment(user);
      if (paymentCount > 0) setShowDirectPaymentDialog(true);
      else setShowPaymentDialog(true);
    },
    onDeleteUser: setUserToDelete,
    onPasswordReset: handlePasswordReset,
    onAssignSources: (user) => {
      setSelectedAgentForSources(user);
      setAssignSourcesDialogOpen(true);
    },
    onAddressChange: refreshUsers,
    onToggleShowPassword: () => setShowPassword((prev) => !prev),
  };

  const resetLoading =
    passwordResetMutation.isPending && passwordResetMutation.variables?.userId
      ? passwordResetMutation.variables.userId
      : null;

  return {
    userType: userType as UsersTableUserType,
    loading,
    filteredUsers,
    searchTerm,
    handleSearch,
    customerTypeFilter,
    setCustomerTypeFilter,
    addressFilter,
    setAddressFilter,
    uniqueCustomerTypes,
    showAddUserForm,
    setShowAddUserForm,
    newUserData,
    setNewUserData,
    addUserMutation,
    handleAddUser,
    showBulkEdit,
    selectedBusinessIds,
    bulkType,
    setBulkType,
    bulkSource,
    setBulkSource,
    bulkUpdateMutation,
    applyBulkUpdate,
    clearBulkSelection,
    selectedIds,
    isCustomerView,
    editingUser,
    editData,
    setEditData,
    showPassword,
    updateUserMutation,
    resetLoading,
    isSelected,
    toggleSelectAll,
    paymentData,
    rowHandlers,
    showRoleChangeDialog,
    setShowRoleChangeDialog,
    existingUserEmail,
    setExistingUserEmail,
    changeUserRoleMutation,
    handleChangeUserRole,
    userToDelete,
    setUserToDelete,
    deleteUserMutation,
    handleDeleteUser,
    selectedCustomerForPayment,
    showPaymentDialog,
    setShowPaymentDialog,
    showDirectPaymentDialog,
    setShowDirectPaymentDialog,
    refetchPaymentData,
    refreshUsers,
    collectPaymentDialogUser,
    setCollectPaymentDialogUser,
    customerDetailView,
    setCustomerDetailView,
    assignSourcesDialogOpen,
    setAssignSourcesDialogOpen,
    selectedAgentForSources,
  };
}
