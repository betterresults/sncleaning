import { useCallback, useEffect, useMemo, useState } from 'react';

export const useAvailabilityUnsavedGuard = (isDirty: boolean) => {
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const targetAttribute = anchor.getAttribute('target');
      if (targetAttribute && targetAttribute !== '_self') return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.href === currentUrl.href || nextUrl.origin !== currentUrl.origin) return;

      event.preventDefault();
      setPendingHref(nextUrl.href);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) setPendingHref(null);
  }, [isDirty]);

  const reset = useCallback(() => setPendingHref(null), []);

  const proceed = useCallback(() => {
    if (!pendingHref) return;
    window.location.assign(pendingHref);
  }, [pendingHref]);

  return useMemo(
    () => ({
      state: pendingHref ? 'blocked' : 'unblocked',
      reset,
      proceed,
    }),
    [pendingHref, proceed, reset]
  );
};
