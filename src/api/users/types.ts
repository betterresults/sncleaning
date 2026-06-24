export type UserListType = 'all' | 'admin' | 'cleaner' | 'customer' | 'office';

export interface UserListItem {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: 'guest' | 'user' | 'admin' | 'customer' | 'sales_agent';
  cleaner_id?: number;
  customer_id?: number;
  type?: 'auth_user' | 'business_customer';
  business_id?: number;
  phone?: string;
  address?: string;
  postcode?: string;
  client_status?: string;
  client_type?: string | null;
  addressCount?: number;
  assigned_sources?: string[] | null;
}
