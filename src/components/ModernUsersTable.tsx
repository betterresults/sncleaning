import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUsersList, useInvalidateUsersList } from '@/hooks/queries/useUsersList';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useCustomerPaymentMethods } from '@/hooks/useCustomerPaymentMethods';
import {
  applyUsersListFilters,
  createEmptyNewUserForm,
  getAddButtonText,
  getTypeTitle,
  getUniqueCustomerTypes,
  UsersListAddUserForm,
  UsersListBulkEditBar,
  UsersListDialogs,
  UsersListFilters,
  UsersListLoading,
  UsersTableRow,
  type AddressFilter,
  type ModernUsersTableProps,
  type NewUserFormData,
  type UserData,
  type UsersTableRowHandlers,
} from '@/components/users/list';

const ModernUsersTable = ({ userType = 'all' }: ModernUsersTableProps) => {
  const { data: users = [], isLoading: loading, error: usersError } = useUsersList(userType);
  const invalidateUsersList = useInvalidateUsersList();
  const refreshUsers = () => invalidateUsersList();

  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resetLoading, setResetLoading] = useState<string | null>(null);

  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [addressFilter, setAddressFilter] = useState<AddressFilter>('all');

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState<NewUserFormData>(() => createEmptyNewUserForm(userType));
  const [addingUser, setAddingUser] = useState(false);
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState<string>('');

  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [collectPaymentDialogUser, setCollectPaymentDialogUser] = useState<UserData | null>(null);

  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<UserData | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDirectPaymentDialog, setShowDirectPaymentDialog] = useState(false);

  const [customerDetailView, setCustomerDetailView] = useState<UserData | null>(null);

  const [assignSourcesDialogOpen, setAssignSourcesDialogOpen] = useState(false);
  const [selectedAgentForSources, setSelectedAgentForSources] = useState<UserData | null>(null);

  const { toast } = useToast();

  const customerIds = users
    .filter((user) => user.type === 'business_customer' && user.business_id)
    .map((user) => Number(user.business_id!));

  const { paymentData, refetch: refetchPaymentData } = useCustomerPaymentMethods(customerIds);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<number[]>([]);
  const [bulkType, setBulkType] = useState<string | 'no-change' | 'empty'>('no-change');
  const [bulkStatus, setBulkStatus] = useState<string | 'no-change'>('no-change');
  const [bulkSource, setBulkSource] = useState<string | 'no-change' | 'empty'>('no-change');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const handleAddressChange = () => {
    refreshUsers();
  };

  const uniqueCustomerTypes = getUniqueCustomerTypes(users);

  const runFilters = (term: string) => {
    setFilteredUsers(applyUsersListFilters(users, term, userType, customerTypeFilter, addressFilter));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    runFilters(term);
  };

  const handleFilterChange = () => {
    runFilters(searchTerm);
  };

  const handleAddUser = async () => {
    if (!newUserData.first_name || !newUserData.last_name || !newUserData.email) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setAddingUser(true);
    try {
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserData.email,
          firstName: newUserData.first_name,
          lastName: newUserData.last_name,
          phone: newUserData.phone || undefined,
          role: userType === 'admin' || userType === 'office' ? newUserData.role : newUserData.role,
        },
      });

      const { data, error } = response;

      let errorMessage = data?.error || null;

      if (error && !errorMessage) {
        try {
          if (error.context && typeof error.context.json === 'function') {
            const errorBody = await error.context.json();
            errorMessage = errorBody?.error || null;
          }
        } catch (e) {
          console.log('Could not parse error context:', e);
        }
      }

      console.log('Error message extracted:', errorMessage);

      const errorLower = (errorMessage || '').toLowerCase();
      const isEmailExists =
        errorLower.includes('already') &&
        (errorLower.includes('registered') || errorLower.includes('exists'));

      console.log('Is email exists error:', isEmailExists);

      if (isEmailExists) {
        console.log('Email already exists, showing role change dialog');
        setExistingUserEmail(newUserData.email);
        setShowAddUserForm(false);
        setShowRoleChangeDialog(true);
        setAddingUser(false);
        return;
      }

      if (errorMessage || error) {
        toast({
          title: 'Error',
          description: errorMessage || 'Failed to create user',
          variant: 'destructive',
        });
        setAddingUser(false);
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
      console.error('Error creating user (caught):', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setAddingUser(false);
    }
  };

  const handleChangeUserRole = async () => {
    setAddingUser(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', existingUserEmail)
        .maybeSingle();

      if (profileError) {
        console.error('Profile query error:', profileError);
        throw new Error('Failed to find user profile');
      }

      if (!profileData) {
        toast({
          title: 'Profile Not Found',
          description:
            'The user exists in authentication but has no profile. Please delete the orphaned user from Supabase Auth and try again.',
          variant: 'destructive',
        });
        setShowRoleChangeDialog(false);
        setAddingUser(false);
        return;
      }

      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profileData.user_id)
        .maybeSingle();

      if (existingRole) {
        await supabase.from('user_roles').delete().eq('user_id', profileData.user_id);
      }

      const { error: roleError } = await supabase.from('user_roles').insert([
        {
          user_id: profileData.user_id,
          role: newUserData.role,
        },
      ] as never);

      if (roleError) throw roleError;

      const roleDisplay =
        newUserData.role === 'admin'
          ? 'Admin'
          : newUserData.role === 'user'
            ? 'Cleaner'
            : newUserData.role === 'sales_agent'
              ? 'Sales Agent'
              : 'Customer';

      toast({
        title: 'Success',
        description: `User role updated to ${roleDisplay}`,
      });

      setShowRoleChangeDialog(false);
      setNewUserData(createEmptyNewUserForm(userType));
      setExistingUserEmail('');
      refreshUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user role';
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: {
          user_id: userToDelete.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      setUserToDelete(null);
      refreshUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setDeletingUser(false);
    }
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

  const updateUser = async (userId: string) => {
    console.log('=== UPDATE USER DEBUG ===');
    console.log('User ID:', userId);
    console.log('User Type:', userType);
    console.log('Edit Data:', editData);

    try {
      setUpdating(true);

      if (userType === 'customer') {
        const row = users.find((u) => u.id === userId);
        console.log('Found user row:', row);

        if (row?.type === 'business_customer' && row.business_id) {
          const customerUpdates: Record<string, unknown> = {};
          if ('client_type' in editData) {
            customerUpdates.clent_type = editData.client_type === 'empty' ? null : editData.client_type;
          }
          if ('client_status' in editData) {
            customerUpdates.client_status = editData.client_status;
          }
          if ('first_name' in editData) {
            customerUpdates.first_name = editData.first_name;
          }
          if ('last_name' in editData) {
            customerUpdates.last_name = editData.last_name;
          }
          if ('email' in editData) {
            customerUpdates.email = editData.email;
          }

          console.log('Customer updates:', customerUpdates);

          const { error: custErr } = await supabase
            .from('customers')
            .update(customerUpdates)
            .eq('id', row.business_id);
          if (custErr) {
            console.error('Customer update error:', custErr);
            throw custErr;
          }
          console.log('Customer table updated successfully');
        }
      }

      console.log('Calling update-user-admin with:', {
        userId: userId,
        updates: {
          first_name: editData.first_name,
          last_name: editData.last_name,
          email: editData.email,
          role: editData.role,
          password: editData.password,
        },
      });

      const { data, error } = await supabase.functions.invoke('update-user-admin', {
        body: {
          userId: userId,
          updates: {
            first_name: editData.first_name,
            last_name: editData.last_name,
            email: editData.email,
            role: editData.role,
            password: editData.password,
          },
        },
      });

      console.log('update-user-admin response:', { data, error });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to update user');

      toast({
        title: 'Success',
        description: editData.password ? 'User details and password updated!' : 'User details updated!',
      });

      cancelEditing();
      refreshUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordReset = async (email: string, userId: string) => {
    setResetLoading(userId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://account.sncleaningservices.co.uk/auth`,
      });

      if (error) throw error;

      toast({
        title: 'Password Reset Email Sent',
        description: `Reset link sent to ${email}`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      console.error('Error sending password reset:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setResetLoading(null);
    }
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

  const applyBulkUpdate = async () => {
    try {
      if (selectedBusinessIds.length === 0) return;
      const updates: Record<string, unknown> = {};
      if (bulkType !== 'no-change') updates.clent_type = bulkType === 'empty' ? null : bulkType;
      if (bulkSource !== 'no-change') updates.source = bulkSource === 'empty' ? null : bulkSource;
      if (Object.keys(updates).length === 0) {
        toast({
          title: 'Nothing to update',
          description: 'Choose Type or Source to apply',
          variant: 'destructive',
        });
        return;
      }
      setBulkUpdating(true);
      const { error } = await supabase.from('customers').update(updates).in('id', selectedBusinessIds);
      if (error) throw error;
      toast({ title: 'Updated', description: `Updated ${selectedBusinessIds.length} customers` });
      setSelectedIds(new Set());
      setSelectedBusinessIds([]);
      setBulkType('no-change');
      setBulkSource('no-change');
      refreshUsers();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Bulk update failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setBulkUpdating(false);
    }
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
      if (paymentCount > 0) {
        setShowDirectPaymentDialog(true);
      } else {
        setShowPaymentDialog(true);
      }
    },
    onDeleteUser: setUserToDelete,
    onPasswordReset: handlePasswordReset,
    onAssignSources: (user) => {
      setSelectedAgentForSources(user);
      setAssignSourcesDialogOpen(true);
    },
    onAddressChange: handleAddressChange,
    onToggleShowPassword: () => setShowPassword((prev) => !prev),
  };

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
    handleFilterChange();
  }, [users, customerTypeFilter, addressFilter]);

  const isCustomerView = userType === 'customer';
  const showBulkEdit = isCustomerView && selectedBusinessIds.length > 0;

  return (
    <div className="space-y-6">
      {userType === 'all' && (
        <>
          <BulkAccountCreationUtility />
          <BulkLinkRecordsUtility />
          <DeleteUserByEmail />
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {getTypeTitle(userType)} ({filteredUsers.length})
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                size="sm"
                variant={showAddUserForm ? 'outline' : 'default'}
              >
                {showAddUserForm ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {getAddButtonText(userType)}
                  </>
                )}
              </Button>
            </div>
          </CardTitle>

          {showAddUserForm && (
            <UsersListAddUserForm
              userType={userType}
              newUserData={newUserData}
              onNewUserDataChange={setNewUserData}
              addingUser={addingUser}
              onSubmit={handleAddUser}
              onCancel={() => setShowAddUserForm(false)}
            />
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
          />

          {showBulkEdit && (
            <UsersListBulkEditBar
              selectedCount={selectedBusinessIds.length}
              bulkType={bulkType}
              onBulkTypeChange={setBulkType}
              bulkSource={bulkSource}
              onBulkSourceChange={setBulkSource}
              bulkUpdating={bulkUpdating}
              onApply={applyBulkUpdate}
              onClear={clearBulkSelection}
              selectedUsers={filteredUsers.filter((u) => selectedIds.has(u.id))}
            />
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <UsersListLoading />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isCustomerView && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            filteredUsers.length > 0 && filteredUsers.every((u) => isSelected(u.id))
                          }
                          onCheckedChange={toggleSelectAll}
                        />
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
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isCustomerView ? 6 : 4}
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
                        updating={updating}
                        resetLoading={resetLoading}
                        isSelected={isSelected(user.id)}
                        paymentData={paymentData}
                        handlers={rowHandlers}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

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
          addingUser={addingUser}
          onChangeUserRole={handleChangeUserRole}
          userToDelete={userToDelete}
          onUserToDeleteChange={setUserToDelete}
          deletingUser={deletingUser}
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
      </Card>
    </div>
  );
};

export default ModernUsersTable;
