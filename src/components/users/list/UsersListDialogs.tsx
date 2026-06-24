import CustomerDetailView from '@/components/customer/CustomerDetailView';
import CustomerPaymentDialog from '@/components/customer/CustomerPaymentDialog';
import { CollectPaymentMethodDialog } from '@/components/payments/CollectPaymentMethodDialog';
import CustomerDirectPaymentDialog from '@/components/payments/CustomerDirectPaymentDialog';
import { AssignSourcesDialog } from '@/components/admin/AssignSourcesDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { createEmptyNewUserForm } from './types';
import type { NewUserFormData, UserData, UsersTableUserType } from './types';

interface UsersListDialogsProps {
  userType: UsersTableUserType;
  newUserData: NewUserFormData;
  onNewUserDataChange: (data: NewUserFormData) => void;
  showRoleChangeDialog: boolean;
  onRoleChangeDialogOpenChange: (open: boolean) => void;
  existingUserEmail: string;
  addingUser: boolean;
  onChangeUserRole: () => void;
  userToDelete: UserData | null;
  onUserToDeleteChange: (user: UserData | null) => void;
  deletingUser: boolean;
  onDeleteUser: () => void;
  selectedCustomerForPayment: UserData | null;
  showPaymentDialog: boolean;
  onShowPaymentDialogChange: (open: boolean) => void;
  showDirectPaymentDialog: boolean;
  onShowDirectPaymentDialogChange: (open: boolean) => void;
  onPaymentMethodsChange: () => void;
  collectPaymentDialogUser: UserData | null;
  onCollectPaymentDialogUserChange: (user: UserData | null) => void;
  customerDetailView: UserData | null;
  onCustomerDetailViewChange: (user: UserData | null) => void;
  assignSourcesDialogOpen: boolean;
  onAssignSourcesDialogOpenChange: (open: boolean) => void;
  selectedAgentForSources: UserData | null;
  onRefreshUsers: () => void;
}

export function UsersListDialogs({
  userType,
  newUserData,
  onNewUserDataChange,
  showRoleChangeDialog,
  onRoleChangeDialogOpenChange,
  existingUserEmail,
  addingUser,
  onChangeUserRole,
  userToDelete,
  onUserToDeleteChange,
  deletingUser,
  onDeleteUser,
  selectedCustomerForPayment,
  showPaymentDialog,
  onShowPaymentDialogChange,
  showDirectPaymentDialog,
  onShowDirectPaymentDialogChange,
  onPaymentMethodsChange,
  collectPaymentDialogUser,
  onCollectPaymentDialogUserChange,
  customerDetailView,
  onCustomerDetailViewChange,
  assignSourcesDialogOpen,
  onAssignSourcesDialogOpenChange,
  selectedAgentForSources,
  onRefreshUsers,
}: UsersListDialogsProps) {
  const roleDisplay =
    newUserData.role === 'admin'
      ? 'Admin'
      : newUserData.role === 'user'
        ? 'Cleaner'
        : newUserData.role === 'sales_agent'
          ? 'Sales Agent'
          : 'Customer';

  return (
    <>
      <AlertDialog open={showRoleChangeDialog} onOpenChange={onRoleChangeDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              A user with email <strong>{existingUserEmail || 'unknown'}</strong> already exists in the
              system. Would you like to change their role to <strong>{roleDisplay}</strong> instead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                onRoleChangeDialogOpenChange(false);
                onNewUserDataChange(createEmptyNewUserForm(userType));
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onChangeUserRole} disabled={addingUser}>
              {addingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => onUserToDeleteChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}? This
              action cannot be undone and will permanently remove the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteUser}
              disabled={deletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedCustomerForPayment && (
        <CustomerPaymentDialog
          open={showPaymentDialog}
          onOpenChange={onShowPaymentDialogChange}
          customerId={Number(selectedCustomerForPayment.business_id || selectedCustomerForPayment.id)}
          customerName={`${selectedCustomerForPayment.first_name} ${selectedCustomerForPayment.last_name}`}
          customerEmail={selectedCustomerForPayment.email}
          onPaymentMethodsChange={onPaymentMethodsChange}
        />
      )}

      {collectPaymentDialogUser && (
        <CollectPaymentMethodDialog
          open={!!collectPaymentDialogUser}
          onOpenChange={(open) => !open && onCollectPaymentDialogUserChange(null)}
          customer={{
            id: collectPaymentDialogUser.business_id || parseInt(collectPaymentDialogUser.id),
            first_name: collectPaymentDialogUser.first_name || '',
            last_name: collectPaymentDialogUser.last_name || '',
            email: collectPaymentDialogUser.email,
          }}
        />
      )}

      {selectedCustomerForPayment && (
        <CustomerDirectPaymentDialog
          open={showDirectPaymentDialog}
          onOpenChange={onShowDirectPaymentDialogChange}
          customerId={Number(selectedCustomerForPayment.business_id || selectedCustomerForPayment.id)}
          customerName={`${selectedCustomerForPayment.first_name} ${selectedCustomerForPayment.last_name}`}
          customerEmail={selectedCustomerForPayment.email}
          onPaymentSuccess={onPaymentMethodsChange}
        />
      )}

      {customerDetailView && (
        <CustomerDetailView
          open={!!customerDetailView}
          onOpenChange={(open) => !open && onCustomerDetailViewChange(null)}
          customerId={customerDetailView.business_id || parseInt(customerDetailView.id)}
          customerName={`${customerDetailView.first_name || ''} ${customerDetailView.last_name || ''}`.trim()}
          customerEmail={customerDetailView.email}
        />
      )}

      <AssignSourcesDialog
        open={assignSourcesDialogOpen}
        onOpenChange={onAssignSourcesDialogOpenChange}
        agent={
          selectedAgentForSources
            ? {
                user_id: selectedAgentForSources.id,
                first_name: selectedAgentForSources.first_name || null,
                last_name: selectedAgentForSources.last_name || null,
                email: selectedAgentForSources.email,
                assigned_sources: selectedAgentForSources.assigned_sources || null,
              }
            : null
        }
        onSuccess={onRefreshUsers}
      />
    </>
  );
}
