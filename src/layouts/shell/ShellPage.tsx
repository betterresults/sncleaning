import type { ReactNode } from 'react';

type ShellPageWidth = 'default' | 'narrow' | 'wide' | 'full';

interface ShellPageProps {
  children: ReactNode;
  /** Optional in-page heading below the shell header */
  title?: string;
  description?: string;
  width?: ShellPageWidth;
  className?: string;
}

const widthClass: Record<ShellPageWidth, string> = {
  default: 'shell-page--default',
  narrow: 'shell-page--narrow',
  wide: 'shell-page--wide',
  full: 'shell-page--full',
};

/**
 * Standard content wrapper inside the shell card.
 * Use instead of ad-hoc max-w-* / space-y-* on every page.
 */
export function ShellPage({
  children,
  title,
  description,
  width = 'default',
  className = '',
}: ShellPageProps) {
  return (
    <div className={`shell-page ${widthClass[width]} ${className}`.trim()}>
      {(title || description) && (
        <header className="shell-page-header">
          {title && <h1 className="shell-page-title">{title}</h1>}
          {description && <p className="shell-page-description">{description}</p>}
        </header>
      )}
      {children}
    </div>
  );
}
