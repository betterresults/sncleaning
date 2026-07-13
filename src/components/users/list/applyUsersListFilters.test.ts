import { describe, expect, it } from 'vitest';
import { applyUsersListFilters, getUniqueCustomerTypes } from '@/components/users/list/applyUsersListFilters';
import type { UserListItem } from '@/api/users';

const users: UserListItem[] = [
  {
    id: 'u1',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    type: 'business_customer',
    client_type: 'residential',
    addressCount: 2,
  },
  {
    id: 'u2',
    email: 'bob@example.com',
    first_name: 'Bob',
    last_name: 'Smith',
    type: 'business_customer',
    client_type: null,
    addressCount: 0,
  },
  {
    id: 'u3',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    type: 'auth_user',
  },
];

describe('getUniqueCustomerTypes', () => {
  it('collects client types including empty placeholder', () => {
    expect(getUniqueCustomerTypes(users).sort()).toEqual(['empty', 'residential']);
  });
});

describe('applyUsersListFilters', () => {
  it('filters by search term on name and email', () => {
    const result = applyUsersListFilters(users, 'jane', 'customer', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u1');
  });

  it('matches full first + last name', () => {
    const result = applyUsersListFilters(users, 'Jane Doe', 'customer', 'all', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u1');
  });

  it('does not match unrelated full names', () => {
    const result = applyUsersListFilters(users, 'Jane Smith', 'customer', 'all', 'all');
    expect(result).toHaveLength(0);
  });

  it('filters business customers by client type', () => {
    const result = applyUsersListFilters(users, '', 'customer', 'residential', 'all');
    expect(result.map((u) => u.id)).toEqual(['u1']);
  });

  it('filters customers with empty client type', () => {
    const result = applyUsersListFilters(users, '', 'customer', 'empty', 'all');
    expect(result.map((u) => u.id)).toEqual(['u2']);
  });

  it('filters customers with addresses', () => {
    const result = applyUsersListFilters(users, '', 'customer', 'all', 'with-addresses');
    expect(result.map((u) => u.id)).toEqual(['u1']);
  });

  it('filters customers without addresses', () => {
    const result = applyUsersListFilters(users, '', 'customer', 'all', 'no-addresses');
    expect(result.map((u) => u.id)).toEqual(['u2', 'u3']);
  });

  it('does not apply customer-only filters for admin list type', () => {
    const result = applyUsersListFilters(users, '', 'admin', 'residential', 'with-addresses');
    expect(result).toHaveLength(3);
  });
});
