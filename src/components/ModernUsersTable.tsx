import React, { useState, useEffect } from 'react';
import { useUsersList, useInvalidateUsersList } from '@/hooks/queries/useUsersList';
import { useUserMutations } from '@/hooks/queries/useUserMutations';
import { useToast } from '@/hooks/use-toast';
import BulkLinkRecordsUtility from '@/components/admin/BulkLinkRecordsUtility';
import BulkAccountCreationUtility from '@/components/admin/BulkAccountCreationUtility';
import { DeleteUserByEmail } from '@/components/admin/DeleteUserByEmail';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserPlus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useCustomerPaymentMethods } from '@/hooks/useCustomerPaymentMethods';
import {
  applyUsersListFilters,
  createEmptyNewUserForm,
  getAddButtonText,
  getUniqueCustomerTypes,
  UsersListAddUserForm,
  UsersListBulkEditBar,
  UsersListDialogs,
  UsersListFilters,
  UsersListLoadingRows,
  UsersTableRow,
  type AddressFilter,
  type ModernUsersTableProps,
  type NewUserFormData,
  type UserData,
  type UsersTableRowHandlers,
} from '@/components/users/list';

const ModernUsersTable = ({ userType = 'all', openCustomerId }: ModernUsersTableProps) => {
  const { data: users = [], isLoading: loading, error: usersError } = useUsersList(userType);
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

  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [addressFilter, setAddressFilter] = useState<AddressFilter>('all');

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState<NewUserFormData>(() => createEmptyNewUserForm(userType));
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState<string>('');

  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [collectPaymentDialogUser, setCollectPaymentDialogUser] = useState<UserData | null>(null);

  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<UserData | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDirectPaymentDialog, setShowDirectPaymentDialog] = useState(false);

  const [customerDetailView, setCustomerDetailView] = useState<UserData | null>(null);

  const [assignSourcesDialogOpen, setAssignSourcesDialogOpen] = useState(false);
  const [selectedAgentForSources, setSelectedAgentForSources] = useState<UserData | null>(null);

  const customerIds = users
    .filter((user) => user.type === 'business_customer' && user.business_id)
    .map((user) => Number(user.business_id!));

  const { paymentData, refetch: refetchPaymentData } = useCustomerPaymentMethods(customerIds);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<number[]>([]);
  const [bulkType, setBulkType] = useState<string | 'no-change' | 'empty'>('no-change');
  const [bulkSource, setBulkSource] = useState<string | 'no-change' | 'empty'>('no-change');

  const uniqueCustomerTypes = getUniqueCustomerTypes(users);

  const runFilters = (term: string) => {
    setFilteredUsers(applyUsersListFilters(users, term, userType, customerTypeFilter, addressFilter));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    runFilters(term);
  };

  useEffect(() => {
    if (!openCustomerId || loading) return;
    const user = users.find(
      (u) => u.business_id === openCustomerId || Number(u.id) === openCustomerId,
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

  useEffect(() => {
    runFilters(searchTerm);
  }, [users, customerTypeFilter, addressFilter]);

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

  const isCustomerView = userType === 'customer';
  const showBulkEdit = isCustomerView && selectedBusinessIds.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {userType === 'all' && (
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-4">
          <BulkAccountCreationUtility />
          <BulkLinkRecordsUtility />
          <DeleteUserByEmail />
        </div>
      )}

      <UsersListFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        userType={userType}
        customerTypeFilter={customerTypeFilter}
        onCustomerTypeFilterChange={setCustomerTypeFilter}
        addressFilter={addressFilter}
        onAddressFilterChange={setAddressFilter}
        uniqueCustomerTypes={uniqueCustomerTypes}
        resultCount={
          <span
            className="inline-flex h-6 min-w-8 items-center justify-center rounded-full bg-black/[0.05] px-2 text-xs font-semibold tabular-nums text-muted-foreground"
            aria-live="polite"
          >
            {loading ? '—' : filteredUsers.length}
          </span>
        }
        actions={
          <Button
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            size="sm"
            variant={showAddUserForm ? 'ghost' : 'outline'}
          >
            {showAddUserForm ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{getAddButtonText(userType)}</span>
              </>
            )}
          </Button>
        }
      />

      {showAddUserForm && (
        <UsersListAddUserForm
          userType={userType}
          newUserData={newUserData}
          onNewUserDataChange={setNewUserData}
          addingUser={addUserMutation.isPending}
          onSubmit={handleAddUser}
          onCancel={() => setShowAddUserForm(false)}
        />
      )}

      {showBulkEdit && (
        <UsersListBulkEditBar
          selectedCount={selectedBusinessIds.length}
          bulkType={bulkType}
          onBulkTypeChange={setBulkType}
          bulkSource={bulkSource}
          onBulkSourceChange={setBulkSource}
          bulkUpdating={bulkUpdateMutation.isPending}
          onApply={applyBulkUpdate}
          onClear={clearBulkSelection}
          selectedUsers={filteredUsers.filter((u) => selectedIds.has(u.id))}
        />
      )}

      <div className="-mx-0.5 min-w-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {isCustomerView && (
                <TableHead className="w-12">
                  {!loading && (
                    <Checkbox
                      checked={
                        filteredUsers.length > 0 && filteredUsers.every((u) => isSelected(u.id))
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  )}
                </TableHead>
              )}
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              {isCustomerView ? (
                <>
                  <TableHead>Type</TableHead>
                  <TableHead>Payment Methods</TableHead>
                  <TableHead>Addresses</TableHead>
                </>
              ) : (
                <TableHead>Role</TableHead>
              )}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={loading}>
            {loading ? (
              <UsersListLoadingRows userType={userType} />
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isCustomerView ? 7 : 4}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <UsersTableRow
                  key={user.id}
                  user={user}
                  isCustomerView={isCustomerView}
                  isEditing={editingUser === user.id}
                  editData={editData}
                  onEditDataChange={setEditData}
                  showPassword={showPassword}
                  updating={updateUserMutation.isPending}
                  resetLoading={
                    passwordResetMutation.isPending &&
                    passwordResetMutation.variables?.userId === user.id
                      ? user.id
                      : null
                  }
                  isSelected={isSelected(user.id)}
                  paymentData={paymentData}
                  handlers={rowHandlers}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UsersListDialogs
        userType={userType}
        newUserData={newUserData}
        onNewUserDataChange={setNewUserData}
        showRoleChangeDialog={showRoleChangeDialog}
        onRoleChangeDialogOpenChange={(open) => {
          setShowRoleChangeDialog(open);
          if (!open) setExistingUserEmail('');
        }}
        existingUserEmail={existingUserEmail}
        addingUser={changeUserRoleMutation.isPending}
        onChangeUserRole={handleChangeUserRole}
        userToDelete={userToDelete}
        onUserToDeleteChange={setUserToDelete}
        deletingUser={deleteUserMutation.isPending}
        onDeleteUser={handleDeleteUser}
        selectedCustomerForPayment={selectedCustomerForPayment}
        showPaymentDialog={showPaymentDialog}
        onShowPaymentDialogChange={setShowPaymentDialog}
        showDirectPaymentDialog={showDirectPaymentDialog}
        onShowDirectPaymentDialogChange={setShowDirectPaymentDialog}
        onPaymentMethodsChange={() => {
          refetchPaymentData();
          refreshUsers();
        }}
        collectPaymentDialogUser={collectPaymentDialogUser}
        onCollectPaymentDialogUserChange={setCollectPaymentDialogUser}
        customerDetailView={customerDetailView}
        onCustomerDetailViewChange={setCustomerDetailView}
        assignSourcesDialogOpen={assignSourcesDialogOpen}
        onAssignSourcesDialogOpenChange={setAssignSourcesDialogOpen}
        selectedAgentForSources={selectedAgentForSources}
        onRefreshUsers={refreshUsers}
      />
    </div>
  );
};

export default ModernUsersTable;
