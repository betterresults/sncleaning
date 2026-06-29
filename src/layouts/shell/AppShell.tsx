import { memo, useCallback, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ShellAmbient } from './ShellAmbient';
import { ShellHeader } from './ShellHeader';
import { ShellDrawer, ShellSidebar } from './ShellSidebar';
import { useShellCollapsed } from './useShellCollapsed';
import type { AppShellProps } from './types';

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
    <div
      className={cn(
        'flex min-h-[100dvh] w-full min-w-0 flex-1 flex-col contain-[layout_style] max-md:m-0 max-md:min-h-[100dvh]',
        'md:m-0 md:mr-shell-gutter md:mt-shell-gutter md:min-h-[calc(100dvh-(var(--shell-gutter)*2))] md:mb-shell-gutter',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col overflow-hidden rounded-none bg-white/[0.97] shadow-none',
          'md:rounded-shell md:shadow-[0_4px_6px_rgba(0,0,0,0.02),0_16px_48px_rgba(0,40,100,0.1),0_0_0_0.5px_rgba(255,255,255,0.8)]',
          'motion-reduce:backdrop-filter-none [@media(prefers-reduced-transparency:reduce)]:bg-white',
        )}
      >
        <ShellHeader
          title={title}
          showBackToAdmin={showBackToAdmin}
          onSignOut={onSignOut}
          showMenuButton={showMenuButton}
          onMenuClick={onMenuClick}
        />
        <div
          className={cn(
            'min-w-0 flex-1 overflow-auto [-webkit-overflow-scrolling:touch]',
            'px-4 pb-5 pt-5 max-md:pb-[max(20px,env(safe-area-inset-bottom))]',
            'md:px-7 md:pb-8 md:pt-6',
          )}
        >
          {children}
        </div>
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
    ],
  );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-clip antialiased [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',system-ui,sans-serif]">
      <ShellAmbient />

      <div
        className={cn(
          'relative z-[1] box-border flex min-h-[100dvh] w-full items-stretch gap-shell-gap overflow-visible pl-0 max-md:p-0',
          'md:items-start md:p-0',
        )}
      >
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
