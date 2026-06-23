import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getRoleHomePath } from '@/lib/authRedirects';
import { devLog } from '@/lib/devLog';
import {
  ALL_AUTHENTICATED_ROLES,
  AppRole,
  ROLES,
  STAFF_ROLES,
  isAppRole,
} from '@/lib/roles';

export interface ProtectedRouteProps {
  allowedRoles: AppRole[];
  /** Cleaners with a linked profile are redirected (e.g. staff routes). */
  redirectCleanersTo?: string;
  /** Redirect specific roles before role allow-list is checked. */
  denyRolesRedirect?: Partial<Record<AppRole, string>>;
  /** Required when the signed-in user is a cleaner. Admins bypass. */
  requireCleanerId?: boolean;
  /** Required when the signed-in user is a customer. Admins bypass. */
  requireCustomerId?: boolean;
  fallbackPath?: string;
}

function RouteLoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Shield className="h-12 w-12 text-blue-500 mx-auto animate-pulse" />
        <div className="text-lg font-medium">{message}</div>
      </div>
    </div>
  );
}

export function ProtectedRoute({
  allowedRoles,
  redirectCleanersTo,
  denyRolesRedirect,
  requireCleanerId = false,
  requireCustomerId = false,
  fallbackPath = '/auth',
}: ProtectedRouteProps) {
  const { user, userRole, cleanerId, customerId, loading } = useAuth();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setSessionValid(false);
      setSessionChecked(true);
      return;
    }

    let cancelled = false;

    const verifySession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error || !session) {
          devLog('ProtectedRoute: invalid session', error);
          setSessionValid(false);
        } else {
          setSessionValid(true);
        }
      } catch (error) {
        console.error('ProtectedRoute: session verification failed', error);
        if (!cancelled) {
          setSessionValid(false);
        }
      } finally {
        if (!cancelled) {
          setSessionChecked(true);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (loading || !sessionChecked) {
    return <RouteLoadingScreen message="Verifying access..." />;
  }

  const unauthenticatedRedirect = <Navigate to={fallbackPath} replace />;
  const roleHomeRedirect = (
    <Navigate
      to={getRoleHomePath({ userRole, cleanerId, customerId })}
      replace
    />
  );

  if (!user || !sessionValid) {
    return unauthenticatedRedirect;
  }

  if (
    redirectCleanersTo &&
    userRole === ROLES.CLEANER &&
    cleanerId
  ) {
    return <Navigate to={redirectCleanersTo} replace />;
  }

  if (userRole && denyRolesRedirect?.[userRole]) {
    return <Navigate to={denyRolesRedirect[userRole]!} replace />;
  }

  if (!isAppRole(userRole) || !allowedRoles.includes(userRole)) {
    return roleHomeRedirect;
  }

  if (requireCleanerId && userRole === ROLES.CLEANER && !cleanerId) {
    return roleHomeRedirect;
  }

  if (requireCustomerId && userRole === ROLES.CUSTOMER && !customerId) {
    return roleHomeRedirect;
  }

  return <Outlet />;
}

/** Admin + sales agent (operations console) */
export function StaffRoute() {
  return (
    <ProtectedRoute
      allowedRoles={STAFF_ROLES}
      redirectCleanersTo="/cleaner-dashboard"
    />
  );
}

/** Admin only */
export function AdminRoute() {
  return <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />;
}

/** Cleaner field app; admins can impersonate */
export function CleanerRoute() {
  return (
    <ProtectedRoute
      allowedRoles={[ROLES.ADMIN, ROLES.CLEANER]}
      requireCleanerId
    />
  );
}

/** Customer portal; admins can view as customer */
export function CustomerRoute() {
  return (
    <ProtectedRoute
      allowedRoles={[ROLES.ADMIN, ROLES.CUSTOMER]}
      denyRolesRedirect={{ [ROLES.CLEANER]: '/cleaner-dashboard' }}
    />
  );
}

/** Customer routes that need a linked customer record */
export function CustomerStrictRoute() {
  return (
    <ProtectedRoute
      allowedRoles={[ROLES.ADMIN, ROLES.CUSTOMER]}
      requireCustomerId
      denyRolesRedirect={{ [ROLES.CLEANER]: '/cleaner-dashboard' }}
    />
  );
}

/** Sales agent task inbox */
export function SalesAgentRoute() {
  return <ProtectedRoute allowedRoles={[ROLES.SALES_AGENT]} />;
}

/** Any signed-in user */
export function AuthenticatedRoute() {
  return <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES} />;
}
