import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CreateBookingDialogWithCustomer from '@/components/booking/CreateBookingDialogWithCustomer';
import CustomerAddressDialog from '@/components/customer/CustomerAddressDialog';
import PaymentMethodStatusIcon from '@/components/customer/PaymentMethodStatusBadge';
import {
  CreditCard,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { CustomerTypeBadge, RoleBadge } from './usersListLabels';
import type { UserData, UsersTableRowHandlers } from './types';

interface CustomerPaymentInfo {
  payment_method_count?: number;
  has_stripe_account?: boolean;
}

interface UsersTableRowProps {
  user: UserData;
  isCustomerView: boolean;
  isEditing: boolean;
  editData: Record<string, unknown>;
  onEditDataChange: (data: Record<string, unknown>) => void;
  showPassword: boolean;
  updating: boolean;
  resetLoading: string | null;
  isSelected: boolean;
  paymentData: Record<string | number, CustomerPaymentInfo | undefined>;
  handlers: UsersTableRowHandlers;
}

export function UsersTableRow({
  user,
  isCustomerView,
  isEditing,
  editData,
  onEditDataChange,
  showPassword,
  updating,
  resetLoading,
  isSelected,
  paymentData,
  handlers,
}: UsersTableRowProps) {
  const paymentKey = user.business_id || user.id;
  const hasPaymentMethods = !!paymentData[paymentKey]?.payment_method_count;

  return (
    <TableRow>
      {isCustomerView && (
        <TableCell>
          <Checkbox checked={isSelected} onCheckedChange={() => handlers.onToggleSelect(user)} />
        </TableCell>
      )}

      <TableCell>
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              placeholder="First Name"
              value={String(editData.first_name ?? '')}
              onChange={(e) => onEditDataChange({ ...editData, first_name: e.target.value })}
              className="w-24"
            />
            <Input
              placeholder="Last Name"
              value={String(editData.last_name ?? '')}
              onChange={(e) => onEditDataChange({ ...editData, last_name: e.target.value })}
              className="w-24"
            />
          </div>
        ) : (
          <div className="font-medium">
            {user.first_name} {user.last_name}
          </div>
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <div className="space-y-2">
            <Input
              type="email"
              value={String(editData.email ?? '')}
              onChange={(e) => onEditDataChange({ ...editData, email: e.target.value })}
              className="w-48"
            />
            {!isCustomerView && (
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password (optional)"
                  value={String(editData.password ?? '')}
                  onChange={(e) => onEditDataChange({ ...editData, password: e.target.value })}
                  className="w-48 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={handlers.onToggleShowPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="font-mono text-sm">{user.email}</div>
        )}
      </TableCell>

      {isCustomerView ? (
        <>
          <TableCell>
            {isEditing && user.type === 'business_customer' ? (
              <Select
                value={String(editData.client_type ?? 'empty')}
                onValueChange={(value) =>
                  onEditDataChange({ ...editData, client_type: value === 'empty' ? null : value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">—</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <CustomerTypeBadge user={user} />
            )}
          </TableCell>
          <TableCell>
            {isCustomerView && user.type === 'business_customer' ? (() => {
              const customerId = Number(user.business_id);
              const customerPaymentData = paymentData[customerId];
              const paymentCount = customerPaymentData?.payment_method_count || 0;
              const hasStripe = customerPaymentData?.has_stripe_account || false;

              return (
                <PaymentMethodStatusIcon
                  paymentMethodCount={paymentCount}
                  hasStripeAccount={hasStripe}
                  onClick={() => handlers.onPaymentMethodsClick(user, paymentCount)}
                />
              );
            })() : (
              <span className="text-sm text-muted-foreground">–</span>
            )}
          </TableCell>
          <TableCell>
            {user.type === 'business_customer' ? (
              <CustomerAddressDialog
                customerId={Number(user.business_id || user.id)}
                addressCount={user.addressCount || 0}
                onAddressChange={handlers.onAddressChange}
              >
                <Button variant="outline" size="sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  {user.addressCount || 0}
                </Button>
              </CustomerAddressDialog>
            ) : (
              <span className="text-sm text-muted-foreground">–</span>
            )}
          </TableCell>
        </>
      ) : (
        <TableCell>
          {isEditing ? (
            <Select
              value={String(editData.role ?? 'guest')}
              onValueChange={(value) => onEditDataChange({ ...editData, role: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">Customer</SelectItem>
                <SelectItem value="user">Cleaner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <RoleBadge role={user.role || 'guest'} />
          )}
        </TableCell>
      )}

      <TableCell className="text-right">
        {isEditing ? (
          <div className="flex gap-2 justify-end">
            <Button size="sm" onClick={() => handlers.onUpdateUser(user.id)} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="outline" onClick={handlers.onCancelEditing}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 justify-end">
            {isCustomerView && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlers.onViewCustomerDetail(user)}
                className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                title="View Customer Details"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log(
                  'Edit button clicked for user:',
                  user.id,
                  user.first_name,
                  user.last_name,
                  'type:',
                  user.type,
                );
                handlers.onStartEditing(user);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {isCustomerView && (
              <CreateBookingDialogWithCustomer
                customer={{
                  id: Number(user.business_id || user.id),
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                  email: user.email || '',
                  phone: user.phone || '',
                }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => console.log('Add booking clicked for:', user.first_name, user.last_name)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CreateBookingDialogWithCustomer>
            )}
            {isCustomerView && !hasPaymentMethods && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log('Collect payment clicked for:', user.first_name, user.last_name, 'user object:', user);
                  handlers.onCollectPayment(user);
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                title="Collect Payment Method"
              >
                <CreditCard className="h-4 w-4" />
              </Button>
            )}
            {!isCustomerView && (
              <>
                {user.role === 'sales_agent' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlers.onAssignSources(user)}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200"
                    title="Assign Customer Sources"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlers.onPasswordReset(user.email, user.id)}
                  disabled={resetLoading === user.id}
                >
                  {resetLoading === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlers.onDeleteUser(user)}
                  className="hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {isCustomerView && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  console.log(
                    'Delete button clicked for:',
                    user.first_name,
                    user.last_name,
                    'type:',
                    user.type,
                  );
                  handlers.onDeleteUser(user);
                }}
                className="hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
