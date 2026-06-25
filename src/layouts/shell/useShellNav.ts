export function getShellSettingsPath(
  userRole?: string,
  customerId?: number | null,
  cleanerId?: number | null
): string {
  if (customerId || userRole === 'guest') return '/customer-settings';
  if (userRole === 'user' || cleanerId) return '/cleaner-settings';
  return '/staff-settings';
}

export function getShellDisplayName(user: {
  email?: string;
  user_metadata?: { first_name?: string };
} | null): string {
  return user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
}

export function getShellGreeting(
  user: { email?: string; user_metadata?: { first_name?: string } } | null,
  userRole?: string
): string {
  if (userRole === 'admin') {
    return user?.user_metadata?.first_name || 'Admin';
  }
  return getShellDisplayName(user);
}
