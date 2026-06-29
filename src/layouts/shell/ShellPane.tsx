import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ShellPaneProps {
  children: ReactNode;
  /** Sticky top region (toolbar, thread header). */
  header?: ReactNode;
  /** Sticky bottom region (composer, actions). */
  footer?: ReactNode;
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
  className,
  bodyClassName,
  'aria-label': ariaLabel,
}: ShellPaneProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-shell border-[0.5px] border-shell-divider',
        className,
      )}
    >
      {header ? (
        <div className="shrink-0 border-b-[0.5px] border-shell-divider">{header}</div>
      ) : null}
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', bodyClassName)}>
        {children}
      </div>
      {footer ? (
        <div className="shrink-0 border-t-[0.5px] border-shell-divider">{footer}</div>
      ) : null}
    </section>
  );
}
