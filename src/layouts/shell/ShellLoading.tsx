import { Loader2 } from 'lucide-react';

interface ShellLoadingProps {
  message?: string;
}

/** In-card loading state — use instead of full-viewport loaders inside the shell. */
export function ShellLoading({ message = 'Loading…' }: ShellLoadingProps) {
  return (
    <div className="shell-loading" role="status" aria-live="polite">
      <Loader2 className="shell-loading-spinner" aria-hidden />
      <span className="shell-loading-text">{message}</span>
    </div>
  );
}
