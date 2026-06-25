import { useNavigate } from 'react-router-dom';
import { ChevronDown, PanelLeftClose, PanelLeft, User } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

export function ShellSidebarBody({
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

  return (
    <div className="shell-sidebar-inner">
      <div className="shell-brand-row">
        <span className="shell-brand-name">SN Cleaning</span>
        {onToggleCollapse && (
          <button
            type="button"
            className="shell-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      <ShellNav items={navigationItems} collapsed={collapsed} onNavigate={onNavigate} />

      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`shell-user${collapsed ? ' shell-user--collapsed' : ''}`}
              onClick={() => {
                navigate(getShellSettingsPath(userRole, customerId, cleanerId));
                onNavigate?.();
              }}
            >
              <div className="shell-user-avatar">
                {initials || <User size={16} />}
              </div>
              <div className="shell-user-text min-w-0 flex-1">
                <div className="shell-user-name truncate">{displayName}</div>
                <div className="shell-user-email truncate">{email}</div>
              </div>
              <ChevronDown size={16} className="shell-user-chevron" />
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" sideOffset={12}>
              {displayName}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

interface ShellSidebarProps extends ShellSidebarBodyProps {
  onSignOut: () => void;
}

export function ShellSidebar({ collapsed, onToggleCollapse, ...props }: ShellSidebarProps) {
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
