/** Debug logging — stripped from production builds via dead-code elimination. */
const isDev = import.meta.env.DEV;

export function devLog(...args: unknown[]): void {
  if (isDev) {
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]): void {
  if (isDev) {
    console.warn(...args);
  }
}
