import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ShellWorkspaceRatio = '1-2' | '2-3' | '1-1';

interface ShellWorkspaceProps {
  /** Left / list pane (typically wrapped in ShellPane). */
  sidebar: ReactNode;
  /** Right / detail pane (typically wrapped in ShellPane). */
  detail: ReactNode;
  /**
   * When true, mobile shows the detail pane and hides the sidebar.
   * Desktop always shows both columns.
   */
  detailActive?: boolean;
  /** Column ratio on large screens. Default `1-2` (one-third + two-thirds). */
  ratio?: ShellWorkspaceRatio;
  /** Grow to fill remaining page height (flex-1 min-h-0). */
  fill?: boolean;
  className?: string;
}

const ratioGridClass: Record<ShellWorkspaceRatio, string> = {
  '1-2': 'lg:grid-cols-3',
  '2-3': 'lg:grid-cols-5',
  '1-1': 'lg:grid-cols-2',
};

const ratioSidebarClass: Record<ShellWorkspaceRatio, string> = {
  '1-2': 'lg:col-span-1',
  '2-3': 'lg:col-span-2',
  '1-1': 'lg:col-span-1',
};

const ratioDetailClass: Record<ShellWorkspaceRatio, string> = {
  '1-2': 'lg:col-span-2',
  '2-3': 'lg:col-span-3',
  '1-1': 'lg:col-span-1',
};

/**
 * Master/detail grid for inbox-style tools (SMS, chat, etc.).
 * Handles mobile list ↔ detail switching via `detailActive`.
 */
export function ShellWorkspace({
  sidebar,
  detail,
  detailActive = false,
  ratio = '1-2',
  fill = true,
  className,
}: ShellWorkspaceProps) {
  const sidebarVisibility = detailActive ? 'hidden lg:flex' : 'flex';
  const detailVisibility = detailActive ? 'flex' : 'hidden lg:flex';

  return (
    <div
      data-shell-workspace
      className={cn(
        'grid min-h-0 grid-cols-1 gap-4',
        ratioGridClass[ratio],
        fill && 'min-h-0 flex-1 overflow-hidden',
        className,
      )}
    >
      <div
        className={cn(
          'min-h-0 h-full flex-col overflow-hidden',
          ratioSidebarClass[ratio],
          sidebarVisibility,
        )}
      >
        {sidebar}
      </div>
      <div
        className={cn(
          'min-h-0 h-full flex-col overflow-hidden',
          ratioDetailClass[ratio],
          detailVisibility,
        )}
      >
        {detail}
      </div>
    </div>
  );
}
