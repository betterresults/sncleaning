import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, PanelLeftClose, PanelLeft, User } from 'lucide-react';
import { ShellNav } from './ShellNav';
import { getShellDisplayName, getShellSettingsPath } from './useShellNav';
import type { ShellNavigationItem, ShellUser } from './types';

interface ShellSidebarBodyProps {
  navigationItems: ShellNavigationItem[];
  user: ShellUser | null;
  userRole?: string;
  customerId?: number | null;
  cleanerId?: number | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}

function ShellSidebarBodyComponent({
  navigationItems,
  user,
  userRole,
  customerId,
  cleanerId,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: ShellSidebarBodyProps) {
  const navigate = useNavigate();
  const displayName = getShellDisplayName(user);
  const email = user?.email ?? '';
  const initials = displayName.slice(0, 1).toUpperCase();

  const handleUserClick = useCallback(() => {
    navigate(getShellSettingsPath(userRole, customerId, cleanerId));
    onNavigate?.();
  }, [navigate, userRole, customerId, cleanerId, onNavigate]);

  return (
    <div className="shell-sidebar-inner">
      <div className="shell-brand-row">
        {!collapsed && <span className="shell-brand-name">SN Cleaning</span>}
        {onToggleCollapse && (
          <button
            type="button"
            className={`shell-collapse-btn${collapsed ? ' shell-collapse-btn--collapsed' : ''}`}
            data-tooltip={collapsed ? 'Expand sidebar' : undefined}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      <ShellNav items={navigationItems} collapsed={collapsed} onNavigate={onNavigate} />

      <button
        type="button"
        className={`shell-user${collapsed ? ' shell-user--collapsed' : ''}`}
        data-tooltip={collapsed ? displayName : undefined}
        onClick={handleUserClick}
      >
        <div className="shell-user-avatar">{initials || <User size={16} />}</div>
        <div className="shell-user-text min-w-0 flex-1">
          <div className="shell-user-name truncate">{displayName}</div>
          <div className="shell-user-email truncate">{email}</div>
        </div>
        <ChevronDown size={16} className="shell-user-chevron" />
      </button>
    </div>
  );
}

function sidebarBodyPropsEqual(
  prev: ShellSidebarBodyProps,
  next: ShellSidebarBodyProps
): boolean {
  return (
    prev.collapsed === next.collapsed &&
    prev.navigationItems === next.navigationItems &&
    prev.userRole === next.userRole &&
    prev.customerId === next.customerId &&
    prev.cleanerId === next.cleanerId &&
    prev.user?.email === next.user?.email &&
    prev.user?.user_metadata?.first_name === next.user?.user_metadata?.first_name &&
    prev.onToggleCollapse === next.onToggleCollapse &&
    prev.onNavigate === next.onNavigate
  );
}

export const ShellSidebarBody = memo(ShellSidebarBodyComponent, sidebarBodyPropsEqual);

interface ShellSidebarProps extends ShellSidebarBodyProps {
  onSignOut: () => void;
}

function ShellSidebarComponent({ collapsed, onToggleCollapse, ...props }: ShellSidebarProps) {
  return (
    <aside
      className={`shell-sidebar${collapsed ? ' shell-sidebar--collapsed' : ''}`}
      aria-label="Sidebar"
      aria-expanded={!collapsed}
    >
      <ShellSidebarBody collapsed={collapsed} onToggleCollapse={onToggleCollapse} {...props} />
    </aside>
  );
}

export const ShellSidebar = memo(ShellSidebarComponent, (prev, next) => {
  return (
    prev.collapsed === next.collapsed &&
    prev.onSignOut === next.onSignOut &&
    sidebarBodyPropsEqual(prev, next)
  );
});

interface ShellDrawerProps extends ShellSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ShellDrawer({ open, onClose, collapsed: _c, onToggleCollapse: _t, ...props }: ShellDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="shell-drawer-backdrop" aria-label="Close menu" onClick={onClose} />
      <aside className="shell-drawer" aria-label="Navigation menu">
        <ShellSidebarBody {...props} onNavigate={onClose} />
      </aside>
    </>
  );
}
