import type { UserListItem } from '@/api/users';

export type UserData = UserListItem;

export type UsersTableUserType = 'all' | 'admin' | 'cleaner' | 'customer' | 'office';

export type AddressFilter = 'all' | 'with-addresses' | 'no-addresses';

export interface ModernUsersTableProps {
  userType?: UsersTableUserType;
}

export interface NewUserFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

export function getDefaultNewUserRole(userType: UsersTableUserType): string {
  if (userType === 'customer') return 'guest';
  if (userType === 'cleaner') return 'user';
  if (userType === 'admin' || userType === 'office') return 'admin';
  return 'guest';
}

export function createEmptyNewUserForm(userType: UsersTableUserType): NewUserFormData {
  return {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: getDefaultNewUserRole(userType),
  };
}

export interface UsersTableRowHandlers {
  onUpdateUser: (userId: string) => void;
  onCancelEditing: () => void;
  onToggleSelect: (user: UserData) => void;
  onViewCustomerDetail: (user: UserData) => void;
  onStartEditing: (user: UserData) => void;
  onCollectPayment: (user: UserData) => void;
  onPaymentMethodsClick: (user: UserData, paymentCount: number) => void;
  onDeleteUser: (user: UserData) => void;
  onPasswordReset: (email: string, userId: string) => void;
  onAssignSources: (user: UserData) => void;
  onAddressChange: () => void;
  onToggleShowPassword: () => void;
}
