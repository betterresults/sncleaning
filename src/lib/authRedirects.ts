import { isCapacitor } from '@/utils/capacitor';
import { ROLES } from '@/lib/roles';

export interface RoleHomeContext {
  userRole: string | null;
  cleanerId: number | null;
  customerId: number | null;
}

/** Default landing path after login or when access to a route is denied. */
export function getRoleHomePath({
  userRole,
  cleanerId,
}: RoleHomeContext): string {
  if (cleanerId) {
    const isMobileWeb =
      typeof window !== 'undefined' && window.innerWidth < 768;
    return isCapacitor() || isMobileWeb
      ? '/cleaner-today'
      : '/cleaner-dashboard';
  }

  if (userRole === ROLES.ADMIN || userRole === ROLES.SALES_AGENT) {
    return '/dashboard';
  }

  if (userRole === ROLES.CUSTOMER || userRole === ROLES.CLEANER) {
    return userRole === ROLES.CLEANER
      ? '/cleaner-dashboard'
      : '/customer-dashboard';
  }

  return '/customer-dashboard';
}
