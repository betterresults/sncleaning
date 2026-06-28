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

function persistFbId(name: "_fbc" | "_fbp", value: string) {
  try {
    setCookie(name, value);
    if (typeof localStorage !== "undefined") localStorage.setItem(name, value);
  } catch {
    // ignore
  }
}

function restoreFromStorage(name: "_fbc" | "_fbp") {
  try {
    if (getCookie(name)) return;
    if (typeof localStorage === "undefined") return;
    const v = localStorage.getItem(name);
    if (v) setCookie(name, v);
  } catch {
    // ignore
  }
}

export const FbclidCapture = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    try {
      // Restore _fbc/_fbp from localStorage if Safari/ITP cleared the cookies
      restoreFromStorage("_fbc");
      restoreFromStorage("_fbp");

      // Mirror Pixel-set _fbp into localStorage for resilience
      const fbp = getCookie("_fbp");
      if (fbp && typeof localStorage !== "undefined" && localStorage.getItem("_fbp") !== fbp) {
        try { localStorage.setItem("_fbp", fbp); } catch { /* ignore */ }
      }

      const params = new URLSearchParams(search);
      const fbclid = params.get("fbclid");
      if (!fbclid) return;

      const existing = getCookie("_fbc");
      // Only (re)write if missing or for a different fbclid
      if (!existing || !existing.endsWith(`.${fbclid}`)) {
        const fbc = `fb.1.${Date.now()}.${fbclid}`;
        persistFbId("_fbc", fbc);
      }
    } catch {
      // no-op
    }
  }, [pathname, search]);

  return null;
};

export default FbclidCapture;