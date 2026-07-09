import { supabase } from '@/integrations/supabase/client';
import type { UserListType } from './types';

export interface AddUserInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  userType: UserListType;
}

export type AddUserResult =
  | { status: 'success' }
  | { status: 'email_exists' }
  | { status: 'error'; message: string };

export async function addUser(input: AddUserInput): Promise<AddUserResult> {
  const response = await supabase.functions.invoke('create-user', {
    body: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone || undefined,
      role: input.role,
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

  const errorLower = (errorMessage || '').toLowerCase();
  const isEmailExists =
    errorLower.includes('already') &&
    (errorLower.includes('registered') || errorLower.includes('exists'));

  if (isEmailExists) {
    return { status: 'email_exists' };
  }

  if (errorMessage || error) {
    return { status: 'error', message: errorMessage || 'Failed to create user' };
  }

  return { status: 'success' };
}

export interface ChangeUserRoleInput {
  email: string;
  role: string;
}

export type ChangeUserRoleResult =
  | { status: 'success'; roleDisplay: string }
  | { status: 'profile_not_found' }
  | { status: 'error'; message: string };

export async function changeUserRole(input: ChangeUserRoleInput): Promise<ChangeUserRoleResult> {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', input.email)
    .maybeSingle();

  if (profileError) {
    console.error('Profile query error:', profileError);
    return { status: 'error', message: 'Failed to find user profile' };
  }

  if (!profileData) {
    return { status: 'profile_not_found' };
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
      role: input.role,
    },
  ] as never);

  if (roleError) {
    return { status: 'error', message: roleError.message || 'Failed to update user role' };
  }

  const roleDisplay =
    input.role === 'admin'
      ? 'Admin'
      : input.role === 'user'
        ? 'Cleaner'
        : input.role === 'sales_agent'
          ? 'Sales Agent'
          : 'Customer';

  return { status: 'success', roleDisplay };
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-user-account', {
    body: { user_id: userId },
  });
  if (error) throw error;
}

export async function resetUserPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://account.sncleaningservices.co.uk/auth',
  });
  if (error) throw error;
}

export interface UpdateUserAdminInput {
  userId: string;
  userType: UserListType;
  users: Array<{
    id: string;
    type?: string;
    business_id?: number;
  }>;
  editData: Record<string, unknown>;
}

export async function updateUserAdmin(input: UpdateUserAdminInput): Promise<void> {
  const { userId, userType, users, editData } = input;

  if (userType === 'customer') {
    const row = users.find((u) => u.id === userId);

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

      const { error: custErr } = await supabase
        .from('customers')
        .update(customerUpdates)
        .eq('id', row.business_id);
      if (custErr) throw custErr;
    }
  }

  const { data, error } = await supabase.functions.invoke('update-user-admin', {
    body: {
      userId,
      updates: {
        first_name: editData.first_name,
        last_name: editData.last_name,
        email: editData.email,
        role: editData.role,
        password: editData.password,
      },
    },
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Failed to update user');
}

export interface BulkUpdateCustomersInput {
  businessIds: number[];
  bulkType: string | 'no-change' | 'empty';
  bulkSource: string | 'no-change' | 'empty';
}

export async function bulkUpdateCustomers(input: BulkUpdateCustomersInput): Promise<number> {
  const updates: Record<string, unknown> = {};
  if (input.bulkType !== 'no-change') {
    updates.clent_type = input.bulkType === 'empty' ? null : input.bulkType;
  }
  if (input.bulkSource !== 'no-change') {
    updates.source = input.bulkSource === 'empty' ? null : input.bulkSource;
  }
  if (Object.keys(updates).length === 0) {
    throw new Error('NOTHING_TO_UPDATE');
  }

  const { error } = await supabase.from('customers').update(updates).in('id', input.businessIds);
  if (error) throw error;
  return input.businessIds.length;
}
