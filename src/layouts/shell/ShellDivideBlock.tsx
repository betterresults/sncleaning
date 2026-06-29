import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ShellDivideBlockProps {
  children: ReactNode;
  /** Two-column grid on large screens (Recent Activity + Performance). */
  split?: boolean;
  className?: string;
}

const divideBlockClass = cn(
  'flex flex-col gap-shell-block',
  '[&+&]:mt-shell-section [&+&]:border-t-[0.5px] [&+&]:border-shell-divider [&+&]:pt-shell-section',
  '[[data-shell-stat-grid]+&]:mt-0 [[data-shell-stat-grid]+&]:border-t-0 [[data-shell-stat-grid]+&]:pt-0',
);

export function ShellDivideBlock({ children, split = false, className }: ShellDivideBlockProps) {
  return (
    <div
      data-shell-divide-block
      className={cn(
        divideBlockClass,
        split && 'grid grid-cols-1 gap-shell-section-gap max-md:gap-0 lg:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ShellSplitCellProps {
  children: ReactNode;
  className?: string;
}

export function ShellSplitCell({ children, className }: ShellSplitCellProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-shell-block',
        'max-md:[&+&]:mt-shell-section max-md:[&+&]:border-t-[0.5px] max-md:[&+&]:border-shell-divider max-md:[&+&]:pt-shell-section',
        className,
      )}
    >
      {children}
    </div>
  );
}
