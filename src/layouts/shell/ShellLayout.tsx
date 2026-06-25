import { Outlet } from 'react-router-dom';
import { AppShell } from './AppShell';
import { useShellLayoutConfig } from './useShellLayoutConfig';

/**
 * Authenticated app layout — wraps all protected routes with the glass shell.
 * Cleaner mobile / Capacitor routes render without the shell (native bottom nav).
 */
export function ShellLayout() {
  const {
    skipShell,
    navigationItems,
    user,
    userRole,
    customerId,
    cleanerId,
    title,
    showBackToAdmin,
    handleSignOut,
  } = useShellLayoutConfig();

  if (skipShell) {
    return <Outlet />;
  }

  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      userRole={userRole}
      customerId={customerId}
      cleanerId={cleanerId}
      title={title}
      showBackToAdmin={showBackToAdmin}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AppShell>
  );
}
