import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, X } from 'lucide-react';
import {
  getAddButtonText,
  UsersListAddUserForm,
  UsersListBulkEditBar,
  UsersListDialogs,
  UsersListFilters,
  UsersListStaffUtilities,
  UsersListTable,
  useModernUsersTable,
  type ModernUsersTableProps,
} from '@/components/users/list';

const ModernUsersTable = (props: ModernUsersTableProps) => {
  const vm = useModernUsersTable(props);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {vm.userType === 'all' && <UsersListStaffUtilities />}

      <UsersListFilters
        searchTerm={vm.searchTerm}
        onSearchChange={vm.handleSearch}
        userType={vm.userType}
        customerTypeFilter={vm.customerTypeFilter}
        onCustomerTypeFilterChange={vm.setCustomerTypeFilter}
        addressFilter={vm.addressFilter}
        onAddressFilterChange={vm.setAddressFilter}
        uniqueCustomerTypes={vm.uniqueCustomerTypes}
        resultCount={
          <span
            className="inline-flex h-6 min-w-8 items-center justify-center rounded-full bg-black/[0.05] px-2 text-xs font-semibold tabular-nums text-muted-foreground"
            aria-live="polite"
          >
            {vm.loading ? '—' : vm.filteredUsers.length}
          </span>
        }
        actions={
          <Button
            onClick={() => vm.setShowAddUserForm(!vm.showAddUserForm)}
            size="sm"
            variant={vm.showAddUserForm ? 'ghost' : 'outline'}
          >
            {vm.showAddUserForm ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{getAddButtonText(vm.userType)}</span>
              </>
            )}
          </Button>
        }
      />

      {vm.showAddUserForm && (
        <UsersListAddUserForm
          userType={vm.userType}
          newUserData={vm.newUserData}
          onNewUserDataChange={vm.setNewUserData}
          addingUser={vm.addUserMutation.isPending}
          onSubmit={vm.handleAddUser}
          onCancel={() => vm.setShowAddUserForm(false)}
        />
      )}

      {vm.showBulkEdit && (
        <UsersListBulkEditBar
          selectedCount={vm.selectedBusinessIds.length}
          bulkType={vm.bulkType}
          onBulkTypeChange={vm.setBulkType}
          bulkSource={vm.bulkSource}
          onBulkSourceChange={vm.setBulkSource}
          bulkUpdating={vm.bulkUpdateMutation.isPending}
          onApply={vm.applyBulkUpdate}
          onClear={vm.clearBulkSelection}
          selectedUsers={vm.filteredUsers.filter((u) => vm.selectedIds.has(u.id))}
        />
      )}

      <UsersListTable
        userType={vm.userType}
        isCustomerView={vm.isCustomerView}
        loading={vm.loading}
        filteredUsers={vm.filteredUsers}
        searchTerm={vm.searchTerm}
        editingUser={vm.editingUser}
        editData={vm.editData}
        onEditDataChange={vm.setEditData}
        showPassword={vm.showPassword}
        updating={vm.updateUserMutation.isPending}
        resetLoading={vm.resetLoading}
        isSelected={vm.isSelected}
        onToggleSelectAll={vm.toggleSelectAll}
        paymentData={vm.paymentData}
        handlers={vm.rowHandlers}
      />

      <UsersListDialogs
        userType={vm.userType}
        newUserData={vm.newUserData}
        onNewUserDataChange={vm.setNewUserData}
        showRoleChangeDialog={vm.showRoleChangeDialog}
        onRoleChangeDialogOpenChange={(open) => {
          vm.setShowRoleChangeDialog(open);
          if (!open) vm.setExistingUserEmail('');
        }}
        existingUserEmail={vm.existingUserEmail}
        addingUser={vm.changeUserRoleMutation.isPending}
        onChangeUserRole={vm.handleChangeUserRole}
        userToDelete={vm.userToDelete}
        onUserToDeleteChange={vm.setUserToDelete}
        deletingUser={vm.deleteUserMutation.isPending}
        onDeleteUser={vm.handleDeleteUser}
        selectedCustomerForPayment={vm.selectedCustomerForPayment}
        showPaymentDialog={vm.showPaymentDialog}
        onShowPaymentDialogChange={vm.setShowPaymentDialog}
        showDirectPaymentDialog={vm.showDirectPaymentDialog}
        onShowDirectPaymentDialogChange={vm.setShowDirectPaymentDialog}
        onPaymentMethodsChange={() => {
          vm.refetchPaymentData();
          vm.refreshUsers();
        }}
        collectPaymentDialogUser={vm.collectPaymentDialogUser}
        onCollectPaymentDialogUserChange={vm.setCollectPaymentDialogUser}
        customerDetailView={vm.customerDetailView}
        onCustomerDetailViewChange={vm.setCustomerDetailView}
        assignSourcesDialogOpen={vm.assignSourcesDialogOpen}
        onAssignSourcesDialogOpenChange={vm.setAssignSourcesDialogOpen}
        selectedAgentForSources={vm.selectedAgentForSources}
        onRefreshUsers={vm.refreshUsers}
      />
    </div>
  );
};

export default ModernUsersTable;
