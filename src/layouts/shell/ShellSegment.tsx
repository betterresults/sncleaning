import type { LucideIcon } from 'lucide-react';

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
      className={`shell-segment${fullWidth ? ' shell-segment--full' : ''}`}
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
            className={`shell-segment__option${isActive ? ' shell-segment__option--active' : ''}`}
            onClick={() => onValueChange(option.value)}
          >
            {Icon && (
              <span className="shell-segment__icon" aria-hidden>
                <Icon />
              </span>
            )}
            {option.shortLabel ? (
              <>
                <span className="shell-segment__label shell-segment__label--long">{option.label}</span>
                <span className="shell-segment__label shell-segment__label--short">{option.shortLabel}</span>
              </>
            ) : (
              <span className="shell-segment__label">{option.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
