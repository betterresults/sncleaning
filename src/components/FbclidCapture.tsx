import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Captures Meta's `fbclid` URL parameter on every route change and
 * persists it as the `_fbc` cookie (90 days), matching Meta's spec:
 *   fb.1.<timestamp_ms>.<fbclid>
 *
 * This ensures that if a visitor lands from a Meta ad on ANY page and
 * later navigates through the funnel, their click ID is preserved and
 * sent with both Pixel and Conversions API events for proper attribution.
 */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return m ? decodeURIComponent(m[3]) : undefined;
}

function setCookie(name: string, value: string, days = 90) {
  if (typeof document === "undefined") return;
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

export const FbclidCapture = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    try {
      const params = new URLSearchParams(search);
      const fbclid = params.get("fbclid");
      if (!fbclid) return;

      const existing = getCookie("_fbc");
      // Only (re)write if missing or for a different fbclid
      if (!existing || !existing.endsWith(`.${fbclid}`)) {
        const fbc = `fb.1.${Date.now()}.${fbclid}`;
        setCookie("_fbc", fbc);
      }
    } catch {
      // no-op
    }
  }, [pathname, search]);

  return null;
};

export default FbclidCapture;