import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ShellListIconTone = 'default' | 'brand' | 'success' | 'warning' | 'error';

const iconToneClass: Record<ShellListIconTone, string> = {
  default: 'bg-black/[0.04] text-shell-text',
  brand: 'bg-shell-stat-brand-bg text-shell-stat-brand',
  success: 'bg-shell-stat-success-bg text-shell-stat-success',
  warning: 'bg-shell-stat-warning-bg text-shell-stat-warning',
  error: 'bg-shell-stat-error-bg text-shell-stat-error',
};

interface ShellListProps extends React.ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  variant?: 'default' | 'notification';
  className?: string;
}

export function ShellList({ children, variant = 'default', className, ...props }: ShellListProps) {
  return (
    <div
      className={cn(
        'flex flex-col',
        variant === 'notification' && 'px-2.5 pb-1.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ShellListItemProps {
  children: ReactNode;
  variant?: 'default' | 'notification';
  clickable?: boolean;
  className?: string;
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  role?: string;
  tabIndex?: number;
}

export function ShellListItem({
  children,
  variant = 'default',
  clickable = false,
  className,
  ...props
}: ShellListItemProps) {
  return (
    <div
      className={cn(
        'group flex border-b border-shell-divider transition-opacity last:border-b-0',
        variant === 'default' && 'items-center gap-3 py-2.5 hover:opacity-85 max-md:items-start max-md:py-3',
        variant === 'notification' && 'items-start gap-2 py-1.5',
        clickable &&
          'cursor-pointer rounded-lg px-1 -mx-1 hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-shell-brand/45 focus-visible:-outline-offset-2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ShellListIconProps {
  icon?: LucideIcon;
  children?: ReactNode;
  tone?: ShellListIconTone;
  variant?: 'default' | 'notification';
  className?: string;
}

export function ShellListIcon({
  icon: Icon,
  children,
  tone = 'default',
  variant = 'default',
  className,
}: ShellListIconProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        variant === 'default' && 'h-7 w-7 [&_svg]:h-3.5 [&_svg]:w-3.5',
        variant === 'notification' && 'h-[26px] w-[26px] [&_svg]:h-[13px] [&_svg]:w-[13px]',
        iconToneClass[tone],
        className,
      )}
      aria-hidden
    >
      {children ?? (Icon ? <Icon /> : null)}
    </span>
  );
}

interface ShellListContentProps {
  children: ReactNode;
  className?: string;
}

export function ShellListContent({ children, className }: ShellListContentProps) {
  return <div className={cn('min-w-0 flex-1', className)}>{children}</div>;
}

interface ShellListTitleProps {
  children: ReactNode;
  variant?: 'default' | 'notification';
  className?: string;
}

export function ShellListTitle({ children, variant = 'default', className }: ShellListTitleProps) {
  return (
    <p
      className={cn(
        'font-medium text-shell-text',
        variant === 'default' &&
          'truncate text-[13px] max-md:line-clamp-2 max-md:whitespace-normal',
        variant === 'notification' && 'line-clamp-2 text-[12.5px] leading-snug',
        className,
      )}
    >
      {children}
    </p>
  );
}

interface ShellListMetaProps {
  children: ReactNode;
  variant?: 'default' | 'notification';
  className?: string;
}

export function ShellListMeta({ children, variant = 'default', className }: ShellListMetaProps) {
  return (
    <p
      className={cn(
        'text-shell-muted',
        variant === 'default' && 'mt-0.5 truncate text-xs max-md:whitespace-nowrap',
        variant === 'notification' && 'mt-px text-[11px]',
        className,
      )}
    >
      {children}
    </p>
  );
}

interface ShellListValueProps {
  children: ReactNode;
  className?: string;
}

export function ShellListValue({ children, className }: ShellListValueProps) {
  return (
    <span className={cn('shrink-0 text-[13px] font-semibold text-shell-text', className)}>
      {children}
    </span>
  );
}

interface ShellListFooterProps {
  children: ReactNode;
  className?: string;
}

export function ShellListFooter({ children, className }: ShellListFooterProps) {
  return <div className={cn('mt-1 pt-3', className)}>{children}</div>;
}

interface ShellEmptyProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ShellEmpty({ children, className, style }: ShellEmptyProps) {
  return (
    <div
      className={cn('py-6 text-center text-[13px] text-shell-muted', className)}
      style={style}
    >
      {children}
    </div>
  );
}
