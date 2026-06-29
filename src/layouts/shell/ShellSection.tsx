import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ShellStatTone = 'brand' | 'success' | 'warning';

const statIconToneClass: Record<ShellStatTone, string> = {
  brand: 'bg-shell-stat-brand-bg text-shell-stat-brand',
  success: 'bg-shell-stat-success-bg text-shell-stat-success',
  warning: 'bg-shell-stat-warning-bg text-shell-stat-warning',
};

interface ShellStatProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: ShellStatTone;
  loading?: boolean;
}

export function ShellStat({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  loading = false,
}: ShellStatProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-[1_1_140px] flex-col gap-1.5 py-1 pr-5',
        '[&+&]:border-l-[0.5px] [&+&]:border-shell-divider [&+&]:pl-5',
        'max-md:flex-[0_0_min(82vw,260px)] max-md:snap-start max-md:rounded-xl max-md:bg-black/[0.025] max-md:p-3',
        'max-md:[&+&]:border-0 max-md:[&+&]:pl-3',
      )}
    >
      <div className="flex items-center gap-2 max-md:items-start">
        <span
          className={cn(
            'inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md [&_svg]:h-3.5 [&_svg]:w-3.5',
            statIconToneClass[tone],
          )}
          aria-hidden
        >
          <Icon />
        </span>
        <span
          className={cn(
            'text-[13px] font-medium tracking-tight text-shell-muted',
            'max-md:min-w-0 max-md:text-xs max-md:leading-tight max-md:whitespace-normal',
            loading &&
              'min-h-3.5 w-[40%] animate-shell-stat-pulse rounded-md bg-black/[0.06] text-transparent',
          )}
        >
          {label}
        </span>
      </div>
      <div>
        <div
          className={cn(
            'text-[26px] font-bold leading-[1.1] tracking-tight text-shell-text',
            'max-md:break-anywhere max-md:text-[22px]',
            loading &&
              'min-h-[26px] w-1/2 animate-shell-stat-pulse rounded-md bg-black/[0.06] text-transparent',
          )}
        >
          {loading ? '—' : value}
        </div>
        {hint && !loading && <div className="text-xs text-shell-faint">{hint}</div>}
      </div>
    </div>
  );
}

interface ShellStatGridProps {
  children: ReactNode;
  className?: string;
}

export function ShellStatGrid({ children, className }: ShellStatGridProps) {
  return (
    <div
      data-shell-stat-grid
      className={cn(
        'mb-shell-section flex flex-wrap gap-0 border-b-[0.5px] border-shell-divider pb-shell-section',
        'max-md:-mb-4 max-md:flex-nowrap max-md:gap-2.5 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:pb-4 max-md:snap-x max-md:snap-proximity max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ShellSectionProps {
  children: ReactNode;
  className?: string;
}

export function ShellSection({ children, className }: ShellSectionProps) {
  return <section className={cn('min-w-0', className)}>{children}</section>;
}

interface ShellSectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function ShellSectionHeader({ title, description, action }: ShellSectionHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-start justify-between gap-3',
        'max-md:flex-col max-md:items-stretch max-md:gap-2.5',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-wrap items-baseline gap-2',
          'max-md:flex-col max-md:items-start max-md:gap-1',
        )}
      >
        <h2 className="m-0 text-[17px] font-semibold leading-tight tracking-tight text-shell-text max-md:text-base">
          {title}
        </h2>
        {description && (
          <p className="m-0 text-[13px] leading-[1.35] text-shell-muted before:mr-2 before:text-shell-faint before:content-['·'] max-md:before:hidden">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div
          className={cn(
            'shrink-0',
            'max-md:w-full max-md:[&>*]:w-full max-md:[&_button]:min-h-11 max-md:[&_button]:justify-center',
          )}
        >
          {action}
        </div>
      )}
    </header>
  );
}

interface ShellSectionBodyProps {
  children: ReactNode;
  tight?: boolean;
  className?: string;
}

export function ShellSectionBody({ children, tight = false, className }: ShellSectionBodyProps) {
  return <div className={cn('min-w-0', tight && 'gap-0', className)}>{children}</div>;
}

/** @deprecated Use ShellSection */
export const ShellCard = ShellSection;
/** @deprecated Use ShellSectionHeader */
export const ShellCardHeader = ShellSectionHeader;
/** @deprecated Use ShellSectionBody */
export const ShellCardBody = ShellSectionBody;
/** @deprecated Use ShellStat */
export const ShellStatCard = ShellStat;
