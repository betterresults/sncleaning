import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type MetaEventName =
  | 'Lead'
  | 'ViewContent'
  | 'Schedule'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'SubscribedButtonClick'
  | 'Purchase';

export interface MetaUserData {
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  external_id?: string | null;
}

export interface MetaCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  [key: string]: unknown;
}

export interface TrackOptions {
  user?: MetaUserData;
  customData?: MetaCustomData;
  eventId?: string;
  eventSourceUrl?: string;
}

const CUSTOM_EVENTS = new Set<MetaEventName>(['SubscribedButtonClick']);

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : undefined;
}

function setCookie(name: string, value: string, days = 90) {
  if (typeof document === 'undefined') return;
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

function readStorage(name: string): string | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    return localStorage.getItem(name) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(name: string, value: string) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(name, value);
  } catch {
    // ignore
  }
}

function persistFbId(name: '_fbc' | '_fbp', value: string) {
  setCookie(name, value);
  writeStorage(name, value);
}

function getFbc(): string | undefined {
  let fbc = getCookie('_fbc');
  if (!fbc) fbc = readStorage('_fbc');
  if (fbc) {
    // Re-prime cookie if it was lost (Safari ITP)
    if (!getCookie('_fbc')) setCookie('_fbc', fbc);
    return fbc;
  }
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid');
  if (fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
    persistFbId('_fbc', fbc);
    return fbc;
  }
  return undefined;
}

function getFbp(): string | undefined {
  let fbp = getCookie('_fbp');
  if (!fbp) fbp = readStorage('_fbp');
  if (fbp && !getCookie('_fbp')) setCookie('_fbp', fbp);
  return fbp;
}

function genUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Fires a Meta Pixel event in the browser and the matching Conversions API
 * event on the server using the same event_id (so Meta deduplicates).
 * Returns the event_id used.
 */
export async function trackMetaEvent(
  eventName: MetaEventName,
  opts: TrackOptions = {},
): Promise<string> {
  const eventId = opts.eventId ?? genUuid();
  const customData = opts.customData ?? {};

  // 1. Browser Pixel
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      if (CUSTOM_EVENTS.has(eventName)) {
        window.fbq('trackCustom', eventName, customData, { eventID: eventId });
      } else {
        window.fbq('track', eventName, customData, { eventID: eventId });
      }
    }
  } catch (err) {
    console.warn('[metaCapi] pixel fire failed', err);
  }

  // 2. Server CAPI (don't await UI; fire-and-forget but capture errors)
  try {
    const body = {
      event_name: eventName,
      event_id: eventId,
      event_source_url:
        opts.eventSourceUrl ?? (typeof window !== 'undefined' ? window.location.href : ''),
      user: {
        ...opts.user,
        fbc: getFbc(),
        fbp: getFbp(),
        client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
      custom_data: customData,
    };
    void supabase.functions
      .invoke('meta-capi-track', { body })
      .then(({ data, error }) => {
        if (error) console.warn('[metaCapi] CAPI invoke error', error);
        // Persist server-issued fbp so subsequent events use the same one
        const assigned = (data as { assigned?: { fbp?: string; fbc?: string } } | null)?.assigned;
        if (assigned?.fbp) persistFbId('_fbp', assigned.fbp);
        if (assigned?.fbc) persistFbId('_fbc', assigned.fbc);
      })
      .catch((err) => console.warn('[metaCapi] CAPI invoke threw', err));
  } catch (err) {
    console.warn('[metaCapi] CAPI prep failed', err);
  }

  return eventId;
}