import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { getShellRouteTitle } from './shellRouteTitles';

interface ShellLayoutContextValue {
  pageTitle: string;
  setPageTitle: (title: string | null) => void;
}

const ShellLayoutContext = createContext<ShellLayoutContextValue | null>(null);

export function ShellLayoutProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [pageTitleOverride, setPageTitleOverride] = useState<string | null>(null);

  useEffect(() => {
    setPageTitleOverride(null);
  }, [pathname]);

  const setPageTitle = useCallback((title: string | null) => {
    setPageTitleOverride(title);
  }, []);

  const pageTitle = useMemo(() => {
    if (pageTitleOverride) {
      return pageTitleOverride;
    }

    return getShellRouteTitle(pathname);
  }, [pageTitleOverride, pathname]);

  const value = useMemo(
    () => ({ pageTitle, setPageTitle }),
    [pageTitle, setPageTitle]
  );

  return (
    <ShellLayoutContext.Provider value={value}>{children}</ShellLayoutContext.Provider>
  );
}

export function useShellLayoutContext(): ShellLayoutContextValue {
  const ctx = useContext(ShellLayoutContext);
  if (!ctx) {
    throw new Error('useShellLayoutContext must be used within ShellLayoutProvider');
  }
  return ctx;
}

/** Override the shell header title for the current page (e.g. dynamic edit screens). */
export function useShellPageTitle(title: string | undefined) {
  const { setPageTitle } = useShellLayoutContext();

  useEffect(() => {
    if (!title) return;
    setPageTitle(title);
    return () => setPageTitle(null);
  }, [title, setPageTitle]);
}
