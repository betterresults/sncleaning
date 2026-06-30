import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ShellAlertBannerTone = 'brand' | 'warning' | 'success';

interface ShellAlertBannerProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: ShellAlertBannerTone;
  className?: string;
}

const toneClass: Record<ShellAlertBannerTone, { root: string; icon: string }> = {
  brand: {
    root: 'border-shell-stat-brand/20 bg-shell-stat-brand-bg',
    icon: 'bg-shell-stat-brand text-white',
  },
  warning: {
    root: 'border-shell-stat-warning/20 bg-shell-stat-warning-bg',
    icon: 'bg-shell-stat-warning text-white',
  },
  success: {
    root: 'border-shell-stat-success/20 bg-shell-stat-success-bg',
    icon: 'bg-shell-stat-success text-white',
  },
};

/**
 * Inline alert row for unread counts, ops warnings, etc.
 * Sits on the shell surface — not inside a Card.
 */
export function ShellAlertBanner({
  icon: Icon,
  title,
  description,
  action,
  tone = 'brand',
  className,
}: ShellAlertBannerProps) {
  const colors = toneClass[tone];

  return (
    <div
      role="status"
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-shell border-[0.5px] p-3',
        colors.root,
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            colors.icon,
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium text-shell-text">{title}</p>
          {description ? (
            <p className="m-0 mt-0.5 text-sm text-shell-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
