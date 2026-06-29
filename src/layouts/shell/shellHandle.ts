/** React Router `handle` payload for shell-aware routes. */
export interface ShellRouteHandle {
  title?: string;
}

declare module 'react-router-dom' {
  interface RouteHandle {
    shell?: ShellRouteHandle;
  }
}
