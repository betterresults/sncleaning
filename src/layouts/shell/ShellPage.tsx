import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ShellPageWidth = 'default' | 'narrow' | 'wide' | 'full';

interface ShellPageProps {
  children: ReactNode;
  /** Optional in-page heading below the shell header */
  title?: string;
  description?: string;
  width?: ShellPageWidth;
  /** Fill remaining viewport height — for master/detail tool pages (SMS, chat). */
  fill?: boolean;
  className?: string;
}

const widthClass: Record<ShellPageWidth, string> = {
  default: 'max-w-shell-default',
  narrow: 'max-w-shell-narrow',
  wide: 'max-w-shell-wide',
  full: 'max-w-none',
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
  fill = false,
  className = '',
}: ShellPageProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-0',
        widthClass[width],
        fill && [
          'min-h-0 overflow-hidden',
          'h-[calc(100dvh-14.5rem)] max-h-[calc(100dvh-14.5rem)]',
          'max-md:h-[calc(100dvh-8.5rem)] max-md:max-h-[calc(100dvh-8.5rem)]',
        ],
        className,
      )}
    >
      {(title || description) && (
        <header className="flex flex-col gap-1.5">
          {title && (
            <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight text-shell-text">
              {title}
            </h1>
          )}
          {description && (
            <p className="m-0 text-[0.9375rem] leading-snug text-shell-muted">{description}</p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
