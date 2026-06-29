import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ShellSegmentOption {
  value: string;
  label: string;
  shortLabel?: string;
  icon?: LucideIcon;
}

interface ShellSegmentProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ShellSegmentOption[];
  /** Stretch to container width (recommended on mobile) */
  fullWidth?: boolean;
  ariaLabel?: string;
}

/**
 * Apple-style segmented control for in-page views.
 * Prefer over shadcn Tabs for shell-aligned pages.
 */
export function ShellSegment({
  value,
  onValueChange,
  options,
  fullWidth = true,
  ariaLabel = 'View',
}: ShellSegmentProps) {
  return (
    <div
      className={cn(
        'max-w-full items-stretch gap-0.5 rounded-shell-segment bg-black/5 p-0.5',
        fullWidth ? 'flex w-full' : 'inline-flex',
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              'inline-flex min-w-0 flex-[1_1_0] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border-none px-3 py-[7px] text-[13px] font-medium tracking-tight transition-[background,color,box-shadow] duration-150 max-[479px]:px-2 max-[479px]:py-[7px] max-[479px]:text-xs',
              isActive
                ? 'bg-white text-shell-text shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'bg-transparent text-shell-muted hover:text-shell-text',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[rgba(0,122,255,0.45)]',
            )}
            onClick={() => onValueChange(option.value)}
          >
            {Icon && (
              <span className="inline-flex shrink-0 items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5">
                <Icon />
              </span>
            )}
            {option.shortLabel ? (
              <>
                <span className="max-[479px]:hidden">{option.label}</span>
                <span className="hidden max-[479px]:inline">{option.shortLabel}</span>
              </>
            ) : (
              <span>{option.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
