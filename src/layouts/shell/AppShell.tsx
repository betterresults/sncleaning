import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShellHeader } from './ShellHeader';
import { ShellDrawer, ShellSidebar } from './ShellSidebar';
import { useShellCollapsed } from './useShellCollapsed';
import type { AppShellProps } from './types';
import './shell.css';

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

  const sidebarProps = {
    navigationItems,
    user,
    userRole,
    customerId,
    cleanerId,
    onSignOut,
    collapsed: !isMobile && collapsed,
    onToggleCollapse: !isMobile ? toggleCollapsed : undefined,
  };

  return (
    <div className={`shell${!isMobile && collapsed ? ' shell--sidebar-collapsed' : ''}`}>
      <div className="shell-ambient" aria-hidden />

      <div className="shell-frame">
        <ShellSidebar {...sidebarProps} />

        <div className="shell-main">
          <div className="shell-card">
            <ShellHeader
              title={title}
              showBackToAdmin={showBackToAdmin}
              onSignOut={onSignOut}
              showMenuButton={isMobile}
              onMenuClick={() => setDrawerOpen(true)}
            />
            <div className="shell-card-body">{children}</div>
          </div>
        </div>
      </div>

      {isMobile && (
        <ShellDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...sidebarProps} />
      )}
    </div>
  );
}
