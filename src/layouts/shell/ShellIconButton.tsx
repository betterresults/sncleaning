import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ShellIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  badge?: ReactNode;
}

/** Header / toolbar icon control — matches shell chrome styling. */
export const ShellIconButton = forwardRef<HTMLButtonElement, ShellIconButtonProps>(
  function ShellIconButton({ children, badge, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-none bg-transparent text-shell-muted transition-colors hover:bg-black/5 hover:text-shell-text',
          className,
        )}
        {...props}
      >
        {children}
        {badge}
      </button>
    );
  },
);

export function ShellIconBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="pointer-events-none absolute right-[3px] top-[3px] box-border inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#ff3b30] px-1 text-center text-[10px] font-bold leading-none text-white"
      aria-hidden
    >
      {children}
    </span>
  );
}
