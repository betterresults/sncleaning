import { memo, useCallback, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShellHeader } from './ShellHeader';
import { ShellDrawer, ShellSidebar } from './ShellSidebar';
import { useShellCollapsed } from './useShellCollapsed';
import type { AppShellProps } from './types';
import './shell.css';

const ShellMain = memo(function ShellMain({
  children,
  title,
  showBackToAdmin,
  onSignOut,
  showMenuButton,
  onMenuClick,
}: {
  children: React.ReactNode;
  title?: string;
  showBackToAdmin?: boolean;
  onSignOut: () => void;
  showMenuButton: boolean;
  onMenuClick: () => void;
}) {
  return (
    <div className="shell-main">
      <div className="shell-card">
        <ShellHeader
          title={title}
          showBackToAdmin={showBackToAdmin}
          onSignOut={onSignOut}
          showMenuButton={showMenuButton}
          onMenuClick={onMenuClick}
        />
        <div className="shell-card-body">{children}</div>
      </div>
    </div>
  );
});

export function AppShell({
  navigationItems,
  user,
  userRole,
  customerId,
  cleanerId,
  title,
  showBackToAdmin,
  onSignOut,
  children,
}: AppShellProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useShellCollapsed();

  const sidebarCollapsed = !isMobile && collapsed;

  const sidebarProps = useMemo(
    () => ({
      navigationItems,
      user,
      userRole,
      customerId,
      cleanerId,
      onSignOut,
      collapsed: sidebarCollapsed,
      onToggleCollapse: !isMobile ? toggleCollapsed : undefined,
    }),
    [
      navigationItems,
      user,
      userRole,
      customerId,
      cleanerId,
      onSignOut,
      sidebarCollapsed,
      isMobile,
      toggleCollapsed,
    ]
  );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className={`shell${sidebarCollapsed ? ' shell--sidebar-collapsed' : ''}`}>
      <div className="shell-ambient" aria-hidden />

      <div className="shell-frame">
        <ShellSidebar {...sidebarProps} />

        <ShellMain
          title={title}
          showBackToAdmin={showBackToAdmin}
          onSignOut={onSignOut}
          showMenuButton={isMobile}
          onMenuClick={openDrawer}
        >
          {children}
        </ShellMain>
      </div>

      {isMobile && <ShellDrawer open={drawerOpen} onClose={closeDrawer} {...sidebarProps} />}
    </div>
  );
}
