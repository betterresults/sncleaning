import { supabase } from '@/integrations/supabase/client';
import type { UserListItem, UserListType } from './types';

export async function fetchUsersList(userType: UserListType): Promise<UserListItem[]> {
  const { data, error } = await supabase.functions.invoke('get-all-users-admin');

  if (error) {
    throw error;
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch data');
  }

  let processedUsers: UserListItem[] = [];

  if (userType === 'customer') {
    const businessCustomers = (data.businessCustomers || []).map((customer: UserListItem) => ({
      ...customer,
      type: 'business_customer' as const,
      business_id: customer.id as unknown as number,
      role: 'customer' as const,
    }));
    processedUsers = businessCustomers;

    const customerIds = businessCustomers
      .map((customer: UserListItem) => customer.id)
      .filter(Boolean);
    let addressCounts: Record<number, number> = {};

    if (customerIds.length > 0) {
      const { data: addressData } = await supabase
        .from('addresses')
        .select('customer_id')
        .in('customer_id', customerIds);

      if (addressData) {
        addressCounts = addressData.reduce(
          (acc: Record<number, number>, addr: { customer_id: number }) => {
            acc[addr.customer_id] = (acc[addr.customer_id] || 0) + 1;
            return acc;
          },
          {},
        );
      }
    }

    processedUsers = processedUsers.map((user) => ({
      ...user,
      type: user.type || 'business_customer',
      addressCount:
        user.type === 'business_customer' || !user.type
          ? addressCounts[Number(user.id)] || 0
          : 0,
    }));
  } else if (userType === 'all') {
    processedUsers = (data.authUsers || []).map((user: UserListItem) => ({
      ...user,
      type: 'auth_user' as const,
    }));
  } else {
    processedUsers = (data.authUsers || []).filter((user: UserListItem) => {
      switch (userType) {
        case 'admin':
          return user.role === 'admin';
        case 'office':
          return user.role === 'admin' || user.role === 'sales_agent';
        case 'cleaner':
          return user.role === 'user';
        default:
          return true;
      }
    });
  }

  return processedUsers;
}
