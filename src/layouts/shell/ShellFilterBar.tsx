import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { shellFilterInputClass } from './shellFilterStyles';

interface ShellFilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  /** Extra filters between search and trailing slot (selects, toggles). */
  filters?: ReactNode;
  /** Result count, primary actions, etc. — right-aligned on desktop. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * Flat filter row under a section header — no Card wrapper.
 * Generalizes the Users list filter pattern for SMS, payments, bulk edit, etc.
 */
export function ShellFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  searchAriaLabel = 'Search',
  filters,
  trailing,
  className,
}: ShellFilterBarProps) {
  const showSearch = onSearchChange !== undefined;

  return (
    <div
      data-shell-filter-bar
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-2 border-b border-shell-divider pb-3 md:flex-nowrap',
        className,
      )}
    >
      {showSearch ? (
        <div className="relative min-w-0 flex-1 basis-full md:max-w-xs md:basis-auto">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={searchAriaLabel}
            className={shellFilterInputClass}
          />
        </div>
      ) : null}

      {filters ? (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 md:flex-nowrap">{filters}</div>
      ) : null}

      {trailing ? (
        <div className="flex w-full shrink-0 items-center justify-between gap-2 md:ml-auto md:w-auto md:justify-end">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
