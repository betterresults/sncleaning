import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type ShellStatTone = 'brand' | 'success' | 'warning';

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
      className={`shell-stat-item shell-stat-item--${tone}${loading ? ' shell-stat-item--loading' : ''}`}
    >
      <div className="shell-stat-item__head">
        <span className="shell-stat-item__icon" aria-hidden>
          <Icon />
        </span>
        <span className="shell-stat-item__label">{label}</span>
      </div>
      <div>
        <div className="shell-stat-item__value">{loading ? '—' : value}</div>
        {hint && !loading && <div className="shell-stat-item__hint">{hint}</div>}
      </div>
    </div>
  );
}

interface ShellStatGridProps {
  children: ReactNode;
}

export function ShellStatGrid({ children }: ShellStatGridProps) {
  return <div className="shell-stat-grid">{children}</div>;
}

interface ShellSectionProps {
  children: ReactNode;
  className?: string;
}

export function ShellSection({ children, className = '' }: ShellSectionProps) {
  return <section className={`shell-section ${className}`.trim()}>{children}</section>;
}

interface ShellSectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function ShellSectionHeader({ title, description, action }: ShellSectionHeaderProps) {
  return (
    <header className="shell-section__header">
      <div className="shell-section__header-main">
        <h2 className="shell-section__title">{title}</h2>
        {description && <p className="shell-section__description">{description}</p>}
      </div>
      {action && <div className="shell-section__action">{action}</div>}
    </header>
  );
}

interface ShellSectionBodyProps {
  children: ReactNode;
  tight?: boolean;
  className?: string;
}

export function ShellSectionBody({ children, tight = false, className = '' }: ShellSectionBodyProps) {
  const bodyClass = ['shell-section__body', tight && 'shell-section__body--tight', className]
    .filter(Boolean)
    .join(' ');

  return <div className={bodyClass}>{children}</div>;
}

/** @deprecated Use ShellSection */
export const ShellCard = ShellSection;
/** @deprecated Use ShellSectionHeader */
export const ShellCardHeader = ShellSectionHeader;
/** @deprecated Use ShellSectionBody */
export const ShellCardBody = ShellSectionBody;
/** @deprecated Use ShellStat */
export const ShellStatCard = ShellStat;
