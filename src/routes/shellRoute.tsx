import type { ReactElement } from 'react';
import { Route } from 'react-router-dom';
import { getShellRouteTitle } from '@/layouts/shell/shellRouteTitles';
import type { ShellRouteHandle } from '@/layouts/shell/shellHandle';

/**
 * Protected route with shell `handle.title` wired from the central title registry.
 * Add new routes here + title in shellRouteTitles.ts (or pass explicit title).
 */
export function shellRoute(
  path: string,
  element: ReactElement,
  title?: string
): ReactElement {
  const shell: ShellRouteHandle = {
    title: title ?? getShellRouteTitle(path),
  };

  return <Route path={path} element={element} handle={{ shell }} />;
}
