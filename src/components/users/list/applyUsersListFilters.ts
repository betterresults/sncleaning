import type { UserListItem } from '@/api/users';
import type { AddressFilter, UsersTableUserType } from './types';

export function getUniqueCustomerTypes(users: UserListItem[]): string[] {
  const types = new Set<string>();
  users.forEach((user) => {
    if (user.type === 'business_customer') {
      if (user.client_type) {
        types.add(user.client_type);
      } else {
        types.add('empty');
      }
    }
  });
  return Array.from(types);
}

export function applyUsersListFilters(
  users: UserListItem[],
  searchTerm: string,
  userType: UsersTableUserType,
  customerTypeFilter: string,
  addressFilter: AddressFilter,
): UserListItem[] {
  let filtered = users;

  if (searchTerm.trim() !== '') {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term),
    );
  }

  if (userType === 'customer') {
    if (customerTypeFilter !== 'all') {
      filtered = filtered.filter((user) => {
        if (user.type === 'business_customer') {
          if (customerTypeFilter === 'empty') {
            return !user.client_type;
          }
          return user.client_type === customerTypeFilter;
        }
        return false;
      });
    }

    if (addressFilter === 'with-addresses') {
      filtered = filtered.filter((user) => (user.addressCount || 0) > 0);
    } else if (addressFilter === 'no-addresses') {
      filtered = filtered.filter((user) => (user.addressCount || 0) === 0);
    }
  }

  return filtered;
}
