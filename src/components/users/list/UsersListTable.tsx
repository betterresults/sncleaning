import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { UsersListLoadingRows } from './UsersListStates';
import { UsersTableRow } from './UsersTableRow';
import type { UserData, UsersTableRowHandlers, UsersTableUserType } from './types';

export interface UsersListTableProps {
  userType: UsersTableUserType;
  isCustomerView?: boolean;
  loading: boolean;
  filteredUsers: UserData[];
  searchTerm: string;
  editingUser: string | null;
  editData: Record<string, unknown>;
  onEditDataChange: (data: Record<string, unknown>) => void;
  showPassword: boolean;
  updating: boolean;
  resetLoading: string | null;
  isSelected: (id: string) => boolean;
  onToggleSelectAll: () => void;
  paymentData: Record<string | number, { payment_method_count?: number; has_stripe_account?: boolean } | undefined>;
  handlers: UsersTableRowHandlers;
}

export const UsersListTable = ({
  userType,
  isCustomerView,
  loading,
  filteredUsers,
  searchTerm,
  editingUser,
  editData,
  onEditDataChange,
  showPassword,
  updating,
  resetLoading,
  isSelected,
  onToggleSelectAll,
  paymentData,
  handlers,
}: UsersListTableProps) => (
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
                  onCheckedChange={onToggleSelectAll}
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
              onEditDataChange={onEditDataChange}
              showPassword={showPassword}
              updating={updating}
              resetLoading={resetLoading}
              isSelected={isSelected(user.id)}
              paymentData={paymentData}
              handlers={handlers}
            />
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
