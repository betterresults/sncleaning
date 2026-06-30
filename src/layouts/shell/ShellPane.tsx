import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ShellPaneProps {
  children: ReactNode;
  /** Sticky top region (toolbar, thread header). */
  header?: ReactNode;
  /** Sticky bottom region (composer, actions). */
  footer?: ReactNode;
  /** Rounded corners — off by default; panes sit on the flat shell surface. */
  rounded?: boolean;
  className?: string;
  bodyClassName?: string;
  'aria-label'?: string;
}

/**
 * Flat bordered panel for master/detail workspaces.
 * Use instead of shadcn Card when building tools on the shell surface.
 */
export function ShellPane({
  children,
  header,
  footer,
  rounded = false,
  className,
  bodyClassName,
  'aria-label': ariaLabel,
}: ShellPaneProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden border-[0.5px] border-shell-divider',
        rounded && 'rounded-shell',
        className,
      )}
    >
      {header ? (
        <div className="shrink-0 border-b-[0.5px] border-shell-divider">{header}</div>
      ) : null}
      <div className={cn('flex h-0 min-h-0 flex-1 flex-col overflow-hidden', bodyClassName)}>
        {children}
      </div>
      {footer ? (
        <div className="shrink-0 border-t-[0.5px] border-shell-divider">{footer}</div>
      ) : null}
    </section>
  );
}
