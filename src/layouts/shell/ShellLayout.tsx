import { Outlet } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ShellLayoutProvider, useShellLayoutContext } from './ShellLayoutContext';
import { useShellLayoutConfig } from './useShellLayoutConfig';

function ShellLayoutFrame() {
  const { pageTitle } = useShellLayoutContext();
  const {
    skipShell,
    navigationItems,
    user,
    userRole,
    customerId,
    cleanerId,
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
      title={pageTitle}
      showBackToAdmin={showBackToAdmin}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AppShell>
  );
}

/**
 * Authenticated app layout — wraps all protected routes with the glass shell.
 * Cleaner mobile / Capacitor routes render without the shell (native bottom nav).
 */
export function ShellLayout() {
  return (
    <ShellLayoutProvider>
      <ShellLayoutFrame />
    </ShellLayoutProvider>
  );
}
