import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, PanelLeftClose, PanelLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden px-4 pb-[max(18px,env(safe-area-inset-bottom))] pt-[max(22px,env(safe-area-inset-top))]',
        collapsed ? 'px-2.5' : 'px-4',
      )}
    >
      <div
        className={cn(
          'flex min-h-8 items-center justify-between gap-2 px-1 pb-5',
          collapsed && 'justify-center px-0 pb-1.5',
        )}
      >
        {!collapsed && (
          <span className="max-w-[180px] overflow-hidden whitespace-nowrap text-xl font-bold tracking-tight text-shell-text transition-[opacity,max-width] duration-shell-sidebar ease-shell-sidebar">
            SN Cleaning
          </span>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-shell-brand/10 text-shell-brand transition-[background,color] duration-[180ms] hover:bg-shell-brand/[0.18] hover:text-[#0066d6]',
              collapsed ? 'h-auto w-full rounded-xl px-2 py-[11px] hover:bg-shell-brand/20' : 'h-8 w-8',
              '[&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:shrink-0',
            )}
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
        className={cn(
          'mt-3 flex w-full shrink-0 cursor-pointer items-center gap-[11px] rounded-[14px] border-none bg-transparent p-2.5 text-left transition-colors hover:bg-white/25',
          collapsed && 'justify-center px-2',
        )}
        data-tooltip={collapsed ? displayName : undefined}
        onClick={handleUserClick}
      >
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7eb8ff] to-shell-brand text-sm font-semibold text-white shadow-[0_2px_10px_rgba(0,122,255,0.25)]">
          {initials || <User size={16} />}
        </div>
        <div
          className={cn(
            'min-w-0 max-w-[160px] flex-1 transition-[opacity,max-width] duration-shell-sidebar ease-shell-sidebar',
            collapsed && 'hidden',
          )}
        >
          <div className="truncate text-sm font-semibold leading-tight tracking-tight text-shell-text">
            {displayName}
          </div>
          <div className="truncate text-[11px] leading-snug text-shell-muted">{email}</div>
        </div>
        <ChevronDown
          size={16}
          className={cn('ml-auto shrink-0 opacity-35 transition-opacity', collapsed && 'hidden')}
        />
      </button>
    </div>
  );
}

function sidebarBodyPropsEqual(
  prev: ShellSidebarBodyProps,
  next: ShellSidebarBodyProps,
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
      data-sidebar-collapsed={collapsed || undefined}
      className={cn(
        'sticky isolate hidden shrink-0 flex-col overflow-visible border-r border-white/45 bg-white/[0.22] shadow-[inset_-1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-[20px] backdrop-saturate-[160%] transition-[width] duration-shell-sidebar ease-shell-sidebar motion-reduce:transition-none',
        'md:flex md:top-0 md:h-[100dvh] md:max-h-[100dvh] md:min-h-[100dvh] md:contain-[layout_style]',
        collapsed ? 'w-shell-sidebar-collapsed' : 'w-shell-sidebar',
        '[@media(prefers-reduced-transparency:reduce)]:bg-white/[0.94] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none',
      )}
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

export function ShellDrawer({
  open,
  onClose,
  collapsed: _c,
  onToggleCollapse: _t,
  ...props
}: ShellDrawerProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 animate-shell-fade cursor-pointer border-none bg-[rgba(20,20,40,0.25)] motion-reduce:animate-none"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-[51] w-[min(280px,88vw)] animate-shell-slide border-r border-white/45 bg-white/[0.94] contain-[layout_style_paint] backdrop-blur-[20px] backdrop-saturate-[160%] motion-reduce:animate-none',
          '[@media(prefers-reduced-transparency:reduce)]:bg-white/[0.94] [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none',
        )}
        aria-label="Navigation menu"
      >
        <ShellSidebarBody {...props} onNavigate={onClose} />
      </aside>
    </>
  );
}
