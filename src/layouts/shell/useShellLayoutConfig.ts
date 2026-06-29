import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerLinenAccess } from '@/hooks/useCustomerLinenAccess';
import { useIsMobile } from '@/hooks/use-mobile';
import { isCapacitor } from '@/utils/capacitor';
import {
  adminNavigation,
  cleanerNavigation,
  getCustomerNavigation,
  salesAgentNavigation,
} from '@/lib/navigationItems';
import type { ShellNavigationItem } from './types';

const CLEANER_MOBILE_APP_ROUTES = new Set([
  '/cleaner-today',
  '/cleaner-bookings',
  '/cleaner-upcoming-bookings',
  '/cleaner-completed-bookings',
]);

function isCustomerArea(pathname: string): boolean {
  return pathname.startsWith('/customer') || pathname.startsWith('/customer/');
}

function isCleanerArea(pathname: string): boolean {
  return pathname.startsWith('/cleaner');
}

export function shouldSkipAppShell(pathname: string, isMobile: boolean): boolean {
  if (CLEANER_MOBILE_APP_ROUTES.has(pathname)) {
    return true;
  }

  if (isCleanerArea(pathname) && (isCapacitor() || isMobile)) {
    return true;
  }

  return false;
}

function resolveNavigationItems(
  userRole: string | null | undefined,
  pathname: string,
  hasLinenAccess: boolean
): ShellNavigationItem[] {
  if (userRole === 'sales_agent') {
    return salesAgentNavigation;
  }

  if (isCustomerArea(pathname) || userRole === 'customer') {
    return getCustomerNavigation(hasLinenAccess);
  }

  if (isCleanerArea(pathname) || userRole === 'cleaner' || userRole === 'user') {
    return cleanerNavigation;
  }

  return adminNavigation;
}

export function useShellLayoutConfig() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { user, userRole, customerId, cleanerId, signOut } = useAuth();
  const needsCustomerNav = isCustomerArea(pathname) || userRole === 'customer';
  const { hasLinenAccess } = useCustomerLinenAccess({ enabled: needsCustomerNav });

  const skipShell = shouldSkipAppShell(pathname, isMobile);

  const navigationItems = useMemo(
    () => resolveNavigationItems(userRole, pathname, hasLinenAccess),
    [userRole, pathname, hasLinenAccess]
  );

  const showBackToAdmin = useMemo(
    () => userRole === 'admin' && (isCustomerArea(pathname) || isCleanerArea(pathname)),
    [userRole, pathname]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut]);

  return {
    skipShell,
    navigationItems,
    user,
    userRole,
    customerId,
    cleanerId,
    showBackToAdmin,
    handleSignOut,
  };
}
