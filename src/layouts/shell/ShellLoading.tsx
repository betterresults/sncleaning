import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShellLoadingProps {
  message?: string;
  className?: string;
}

/** In-card loading state — use instead of full-viewport loaders inside the shell. */
export function ShellLoading({ message = 'Loading…', className }: ShellLoadingProps) {
  return (
    <div
      className={cn(
        'flex min-h-48 flex-col items-center justify-center gap-3 px-4 py-8 text-shell-muted',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-7 w-7 animate-spin text-shell-brand" aria-hidden />
      <span className="text-[0.9375rem] font-medium">{message}</span>
    </div>
  );
}
